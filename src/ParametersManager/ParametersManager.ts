import { json2Properties } from "@dev-team-tool/json-2-properties";
import { Property } from "../types";

export class ParametersManager {
  #url: string = "https://parameter-store.harry-9ce.workers.dev";
  #token: string;
  #environment: string;
  #serviceId: string;
  #cachedParams: Property[] | undefined;

  constructor(token: string, environment: string, serviceId: string) {
    this.#token = token;
    this.#environment = environment;
    this.#serviceId = serviceId;
  }

  getParameters = async (): Promise<Property[]> => {
    if (this.#cachedParams) {
      this.#cachedParams;
    }

    const params = await this.getParametersAsJson<any>();

    const properties = json2Properties(params);
    this.#cachedParams = properties;
    return this.#cachedParams;
  };

  getParametersAsJson = async <T>(): Promise<T> => {
    const url = `${this.#url}/${this.#environment}/${this.#serviceId}`;

    let response;
    try {
      response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": "parameter-store-node",
          "Content-Type": "application/json",
          Authorization: this.#token,
        },
      });

      if (response.status > 299) {
        console.error(`Status code: ${response.status} returned`);
        throw new Error();
      }
    } catch (error) {
      console.error(error);
      throw new Error(
        "Couldn't get Parameters. Something unexpected to happen",
      );
    }

    try {
      const result = (await response.json()) as T;
      return result;
    } catch (err) {
      console.error(err);
      throw new Error(
        "Failed to ready body from HTTP request when getting Properties",
      );
    }
  };
}
