import { injectable, singleton } from "tsyringe";
import axios from "axios";
import { GetTokenResponse } from "./response.types";

@singleton()
@injectable()
export class StepikApiClient {
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.clientId = process.env.STEPIK_CLIENT_ID || "";
    this.clientSecret = process.env.STEPIK_CLIENT_SECRET || "";
  }

  public getCourseInfo = async (): Promise<GetTokenResponse> => {
    return await this.getToken();
  };

  private async getToken(): Promise<GetTokenResponse> {
    try {
      const response = await axios.post(
        "https://stepik.org/oauth2/access_token/",
        {
          grant_type: "client_credentials",
          client_id: this.clientId,
          client_secret: this.clientSecret,
        },
      );
      return response.data;
    } catch (error) {
      throw new Error("Failed to get token from Stepik");
    }
  }
}
