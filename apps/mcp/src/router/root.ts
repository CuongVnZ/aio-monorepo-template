import { z } from "zod";

import { createProcedureBuilder, Router } from "../core/routing";
import { getGlobalServices } from "../inject";
import { MCPTools } from "../tools";

const createContext = async () => {
  const services = await getGlobalServices();
  return {
    services,
  };
};

const procedureBuilder = createProcedureBuilder<
  any,
  any,
  Awaited<ReturnType<typeof createContext>>
>();

const router = new Router(createContext);

router.extend({
  [MCPTools.HelloWorld]: procedureBuilder
    .description("Get the base agent prompt")
    .input(z.object({}))
    .prompt(async ({ input }) => {
      return `[MCP] Hello World`;
    }),

  [MCPTools.FindSum]: procedureBuilder
    .description("Get the base agent prompt test")
    .input(
      z.object({
        a: z.number().describe("The first number"),
        b: z.number().describe("The second number"),
      }),
    )
    .prompt(async ({ input }) => {
      return `[MCP] Find Sum: ${input.a + input.b}`;
    }),
});

router.extend({
  [MCPTools.Ping]: procedureBuilder
    .description("Get the active journey for a patient")
    .input(z.object({}))
    .resource(async ({ input, ctx }) => {
      return `[MCP] Ping`;
    }),

  [MCPTools.GetWeather]: procedureBuilder
    .description("Get project's standard operating procedures")
    .input(z.object({}))
    .resource(async ({ input, ctx }) => {
      const output = `[MCP] Get Weather`;

      return output;
    }),
});

export default router;
