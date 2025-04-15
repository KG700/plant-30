import { getDate } from ".";

describe("utils", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(Date.UTC(2025, 3, 10, 0, 0, 0, 0)));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe("getDate", () => {
    it("returns todays date when passed 0 daysAgo", () => {
      const date = getDate(0);
      expect(date).toEqual(new Date(Date.UTC(2025, 3, 10, 0, 0, 0, 0)));
    });

    it("returns yesterdays date when passed 1 daysAgo", () => {
      const date = getDate(1);
      expect(date).toEqual(new Date(Date.UTC(2025, 3, 9, 0, 0, 0, 0)));
    });
  });
});
