import { json2Properties } from "@dev-team-tool/json-2-properties";
import { ParametersManager } from "./ParametersManager";

jest.mock("@dev-team-tool/json-2-properties", () => ({
  json2Properties: jest.fn(),
}));

describe("ParametersManager", () => {
  const token = "test-token";
  const environment = "stage";
  const serviceId = "service-id";

  const createManager = () =>
    new ParametersManager(token, environment, serviceId);

  const mockFetch = (response: { status: number; json: jest.Mock }) => {
    global.fetch = jest.fn(async () => response as any) as jest.Mock;
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns parameters when request succeeds", async () => {
    const raw = { foo: { bar: true } };
    const properties = [{ key: "foo.bar", value: true }];

    mockFetch({
      status: 200,
      json: jest.fn(async () => raw),
    });
    (json2Properties as jest.Mock).mockReturnValue(properties);

    const manager = createManager();
    const result = await manager.getParameters();

    expect(global.fetch).toHaveBeenCalledWith(
      "https://parameter-store.harry-9ce.workers.dev/stage/service-id",
      {
        method: "GET",
        headers: {
          "User-Agent": "parameter-store-node",
          "Content-Type": "application/json",
          Authorization: "test-token",
        },
      },
    );
    expect(json2Properties).toHaveBeenCalledWith(raw);
    expect(result).toEqual(properties);
  });

  it("throws when request returns non-2xx", async () => {
    mockFetch({
      status: 403,
      json: jest.fn(async () => ({})),
    });

    const manager = createManager();

    await expect(manager.getParameters()).rejects.toThrow(
      "Couldn't get Parameters. Something unexpected to happen",
    );
  });

  it("throws when response body cannot be read", async () => {
    mockFetch({
      status: 200,
      json: jest.fn(async () => {
        throw new Error("bad json");
      }),
    });

    const manager = createManager();

    await expect(manager.getParameters()).rejects.toThrow(
      "Failed to ready body from HTTP request when getting Properties",
    );
  });

  it("throws when fetch fails", async () => {
    global.fetch = jest.fn(async () => {
      throw new Error("network down");
    }) as jest.Mock;

    const manager = createManager();

    await expect(manager.getParameters()).rejects.toThrow(
      "Couldn't get Parameters. Something unexpected to happen",
    );
  });
});
