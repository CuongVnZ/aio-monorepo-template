import { z } from "zod";

export enum MCPTools {
  HelloWorld = "hello-world",
  GetWeather = "get-weather",
  FindSum = "find-sum",
  Ping = "ping",
}

export const MCPToolsSchema = z.nativeEnum(MCPTools);