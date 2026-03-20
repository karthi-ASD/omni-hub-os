import { describe, it, expect } from "vitest";
import { resolveUserType, resolveAppMode, assertNoEmployeeClientCrossover } from "../role-resolver";

describe("resolveUserType", () => {
  it("TEST 1: hr_employees + client_users + no roles → employee", () => {
    expect(
      resolveUserType({ roles: [], clientUserId: "cu-1", isEmployeeByHR: true })
    ).toBe("employee");
  });

  it("TEST 2: client_users only → client", () => {
    expect(
      resolveUserType({ roles: [], clientUserId: "cu-1", isEmployeeByHR: false })
    ).toBe("client");
  });

  it("TEST 3: business_admin role → business_admin", () => {
    expect(
      resolveUserType({ roles: ["business_admin"], clientUserId: null })
    ).toBe("business_admin");
  });

  it("TEST 4: no roles, no client, no employee → employee fallback", () => {
    expect(
      resolveUserType({ roles: [], clientUserId: null, isEmployeeByHR: false })
    ).toBe("employee");
  });

  it("super_admin always wins", () => {
    expect(
      resolveUserType({ roles: ["super_admin"], clientUserId: "cu-1", isEmployeeByHR: true })
    ).toBe("super_admin");
  });

  it("employee role wins over clientUserId", () => {
    expect(
      resolveUserType({ roles: ["employee"], clientUserId: "cu-1", isEmployeeByHR: false })
    ).toBe("employee");
  });

  it("hr_manager role wins over clientUserId", () => {
    expect(
      resolveUserType({ roles: ["hr_manager"], clientUserId: "cu-1" })
    ).toBe("employee");
  });

  it("manager role wins over clientUserId", () => {
    expect(
      resolveUserType({ roles: ["manager"], clientUserId: "cu-1" })
    ).toBe("employee");
  });

  it("isEmployeeByHR alone (no roles, with clientUserId) → employee", () => {
    expect(
      resolveUserType({ roles: [], clientUserId: "cu-1", isEmployeeByHR: true })
    ).toBe("employee");
  });
});

describe("assertNoEmployeeClientCrossover", () => {
  it("throws if employee is classified as client", () => {
    expect(() =>
      assertNoEmployeeClientCrossover({
        isEmployeeByHR: true,
        roles: [],
        userType: "client",
        clientUserId: null,
        userId: "test-user",
      })
    ).toThrow("SECURITY_VIOLATION");
  });

  it("throws if staff still has clientUserId", () => {
    expect(() =>
      assertNoEmployeeClientCrossover({
        isEmployeeByHR: true,
        roles: [],
        userType: "employee",
        clientUserId: "cu-leaked",
        userId: "test-user",
      })
    ).toThrow("SECURITY_VIOLATION");
  });

  it("throws if role-based staff has clientUserId", () => {
    expect(() =>
      assertNoEmployeeClientCrossover({
        isEmployeeByHR: false,
        roles: ["employee"],
        userType: "employee",
        clientUserId: "cu-leaked",
        userId: "test-user",
      })
    ).toThrow("SECURITY_VIOLATION");
  });

  it("does not throw for correct employee resolution", () => {
    expect(() =>
      assertNoEmployeeClientCrossover({
        isEmployeeByHR: true,
        roles: [],
        userType: "employee",
        clientUserId: null,
        userId: "test-user",
      })
    ).not.toThrow();
  });

  it("does not throw for pure client", () => {
    expect(() =>
      assertNoEmployeeClientCrossover({
        isEmployeeByHR: false,
        roles: [],
        userType: "client",
        clientUserId: "cu-1",
        userId: "test-user",
      })
    ).not.toThrow();
  });
});

describe("resolveAppMode", () => {
  it("staff with businessId → client_business", () => {
    expect(
      resolveAppMode({ roles: ["employee"], clientUserId: null, businessId: "b-1", isEmployeeByHR: false })
    ).toBe("client_business");
  });

  it("staff without businessId → internal_staff", () => {
    expect(
      resolveAppMode({ roles: ["employee"], clientUserId: null, businessId: null, isEmployeeByHR: false })
    ).toBe("internal_staff");
  });

  it("isEmployeeByHR with businessId → client_business (not client_portal)", () => {
    expect(
      resolveAppMode({ roles: [], clientUserId: "cu-1", businessId: "b-1", isEmployeeByHR: true })
    ).toBe("client_business");
  });
});
