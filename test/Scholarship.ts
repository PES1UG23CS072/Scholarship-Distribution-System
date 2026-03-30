import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";

describe("Scholarship Distribution System - Security Tests", async function () {
  const { viem } = await network.create();
  const publicClient = await viem.getPublicClient();
  
  // Get test accounts
  const [adminAccount, studentAccount, unauthorizedAccount] = await viem.getWalletClients();

  it("Should deploy Scholarship contract successfully", async function () {
    const contract = await viem.deployContract("Scholarship");
    assert.ok(contract.address, "Contract deployed with valid address");
  });

  it("Should allow admin to post a scholarship allocation", async function () {
    const contract = await viem.deployContract("Scholarship");
    
    const uid = "SCHOL001";
    const amount = BigInt("1000000000000000000"); // 1 ETH
    
    await viem.assertions.emitWithArgs(
      contract.write.postAllocation([uid, studentAccount.address, amount], {
        account: adminAccount,
      }),
      contract,
      "ScholarshipAllocated",
      [uid, studentAccount.address, amount]
    );

    const scholarship = await contract.read.getScholarship([uid]);
    assert.equal(scholarship.uid, uid, "Scholarship UID matches");
    assert.equal(scholarship.studentAddress, studentAccount.address, "Student address matches");
    assert.equal(scholarship.amount, amount, "Amount matches");
    assert.equal(scholarship.status, 0n, "Status should be PENDING (0)");
  });

  it("SECURITY: Non-admin should NOT be able to post allocation", async function () {
    const contract = await viem.deployContract("Scholarship");
    
    const uid = "SCHOL002";
    const amount = BigInt("1000000000000000000");
    
    try {
      await contract.write.postAllocation(
        [uid, studentAccount.address, amount],
        { account: unauthorizedAccount }
      );
      assert.fail("Unauthorized user was able to post allocation - SECURITY BREACH");
    } catch (error) {
      assert.ok(
        error instanceof Error && error.message.includes("Only admin"),
        "Correctly rejected unauthorized postAllocation"
      );
    }
  });

  it("Should allow admin to verify eligibility", async function () {
    const contract = await viem.deployContract("Scholarship");
    
    const uid = "SCHOL003";
    const amount = BigInt("1000000000000000000");
    
    // Admin posts allocation
    await contract.write.postAllocation([uid, studentAccount.address, amount], {
      account: adminAccount,
    });

    // Admin verifies
    await viem.assertions.emitWithArgs(
      contract.write.verifyEligibility([uid], { account: adminAccount }),
      contract,
      "ScholarshipVerified",
      [uid, studentAccount.address]
    );

    const scholarship = await contract.read.getScholarship([uid]);
    assert.equal(scholarship.status, 1n, "Status should be VERIFIED (1)");
  });

  it("SECURITY: Non-admin should NOT be able to verify eligibility", async function () {
    const contract = await viem.deployContract("Scholarship");
    
    const uid = "SCHOL004";
    const amount = BigInt("1000000000000000000");
    
    // Admin posts allocation
    await contract.write.postAllocation([uid, studentAccount.address, amount], {
      account: adminAccount,
    });

    // Try to verify as unauthorized user
    try {
      await contract.write.verifyEligibility([uid], { account: unauthorizedAccount });
      assert.fail("Unauthorized user was able to verify scholarship - SECURITY BREACH");
    } catch (error) {
      assert.ok(
        error instanceof Error && error.message.includes("Only admin"),
        "Correctly rejected unauthorized verifyEligibility"
      );
    }
  });

  it("Should allow admin to release funds to verified scholarship", async function () {
    const contract = await viem.deployContract("Scholarship");
    
    const uid = "SCHOL005";
    const amount = BigInt("1000000000000000000");
    
    // Admin posts allocation
    await contract.write.postAllocation([uid, studentAccount.address, amount], {
      account: adminAccount,
    });

    // Admin verifies
    await contract.write.verifyEligibility([uid], { account: adminAccount });

    // Admin releases funds (send the amount with the transaction)
    await viem.assertions.emitWithArgs(
      contract.write.releaseFunds([uid], {
        account: adminAccount,
        value: amount,
      }),
      contract,
      "ScholarshipReleased",
      [uid, studentAccount.address, amount]
    );

    const scholarship = await contract.read.getScholarship([uid]);
    assert.equal(scholarship.status, 2n, "Status should be RELEASED (2)");
  });

  it("SECURITY: Non-admin should NOT be able to release funds", async function () {
    const contract = await viem.deployContract("Scholarship");
    
    const uid = "SCHOL006";
    const amount = BigInt("1000000000000000000");
    
    // Admin posts allocation
    await contract.write.postAllocation([uid, studentAccount.address, amount], {
      account: adminAccount,
    });

    // Admin verifies
    await contract.write.verifyEligibility([uid], { account: adminAccount });

    // Try to release as unauthorized user
    try {
      await contract.write.releaseFunds([uid], {
        account: unauthorizedAccount,
        value: amount,
      });
      assert.fail("Unauthorized user was able to release funds - CRITICAL SECURITY BREACH");
    } catch (error) {
      assert.ok(
        error instanceof Error && error.message.includes("Only admin"),
        "Correctly rejected unauthorized releaseFunds"
      );
    }
  });

  it("SECURITY: Should not allow fund release on PENDING status", async function () {
    const contract = await viem.deployContract("Scholarship");
    
    const uid = "SCHOL007";
    const amount = BigInt("1000000000000000000");
    
    // Admin posts allocation (status = PENDING)
    await contract.write.postAllocation([uid, studentAccount.address, amount], {
      account: adminAccount,
    });

    // Try to release without verification
    try {
      await contract.write.releaseFunds([uid], {
        account: adminAccount,
        value: amount,
      });
      assert.fail("Admin was able to release funds on PENDING status - SECURITY BREACH");
    } catch (error) {
      assert.ok(
        error instanceof Error && error.message.includes("VERIFIED"),
        "Correctly rejected fund release on PENDING status"
      );
    }
  });

  it("SECURITY: Should not allow double-release of funds", async function () {
    const contract = await viem.deployContract("Scholarship");
    
    const uid = "SCHOL008";
    const amount = BigInt("1000000000000000000");
    
    // Admin posts allocation
    await contract.write.postAllocation([uid, studentAccount.address, amount], {
      account: adminAccount,
    });

    // Admin verifies
    await contract.write.verifyEligibility([uid], { account: adminAccount });

    // Admin releases funds
    await contract.write.releaseFunds([uid], {
      account: adminAccount,
      value: amount,
    });

    // Try to release again
    try {
      await contract.write.releaseFunds([uid], {
        account: adminAccount,
        value: amount,
      });
      assert.fail("Double-release of funds was allowed - CRITICAL SECURITY BREACH");
    } catch (error) {
      assert.ok(
        error instanceof Error && error.message.includes("VERIFIED"),
        "Correctly prevented double-release"
      );
    }
  });

  it("Should track all events for audit trail", async function () {
    const contract = await viem.deployContract("Scholarship");
    const deploymentBlockNumber = await publicClient.getBlockNumber();
    
    const uid = "SCHOL009";
    const amount = BigInt("1000000000000000000");
    
    // Post allocation
    await contract.write.postAllocation([uid, studentAccount.address, amount], {
      account: adminAccount,
    });

    // Verify
    await contract.write.verifyEligibility([uid], { account: adminAccount });

    // Release
    await contract.write.releaseFunds([uid], {
      account: adminAccount,
      value: amount,
    });

    // Get all events
    const logs = await publicClient.getLogs({
      address: contract.address,
      fromBlock: deploymentBlockNumber,
    });

    const allocationEvents = logs.filter(
      (log) => log.topics[0] === contract.events.ScholarshipAllocated.signature
    );
    const verificationEvents = logs.filter(
      (log) => log.topics[0] === contract.events.ScholarshipVerified.signature
    );
    const releaseEvents = logs.filter(
      (log) => log.topics[0] === contract.events.ScholarshipReleased.signature
    );

    assert.ok(allocationEvents.length > 0, "ScholarshipAllocated event logged");
    assert.ok(verificationEvents.length > 0, "ScholarshipVerified event logged");
    assert.ok(releaseEvents.length > 0, "ScholarshipReleased event logged");
  });

  it("Should allow students to query their scholarships", async function () {
    const contract = await viem.deployContract("Scholarship");
    
    const uid1 = "SCHOL010A";
    const uid2 = "SCHOL010B";
    const amount = BigInt("1000000000000000000");
    
    // Admin posts two allocations for same student
    await contract.write.postAllocation([uid1, studentAccount.address, amount], {
      account: adminAccount,
    });
    
    await contract.write.postAllocation([uid2, studentAccount.address, amount], {
      account: adminAccount,
    });

    // Query student's scholarships
    const studentScholarships = await contract.read.getStudentScholarships([
      studentAccount.address,
    ]);

    assert.equal(studentScholarships.length, 2, "Student should have 2 scholarships");
    assert.ok(
      studentScholarships.includes(uid1),
      "Student scholarships should include uid1"
    );
    assert.ok(
      studentScholarships.includes(uid2),
      "Student scholarships should include uid2"
    );
  });
});
