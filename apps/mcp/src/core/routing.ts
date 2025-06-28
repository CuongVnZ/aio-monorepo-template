import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import splitURI from "../helpers/uri";
import { isSchemaFlatObject } from "../utils";

// Define handler types to avoid repetition
type HandlerFunction<TInput, TOutput, TContext> = ({
  input,
  ctx,
}: {
  input: TInput;
  ctx: TContext;
}) => Promise<TOutput> | TOutput;

// Add a utility type to extract the return type from a handler function
type InferHandlerOutput<T> =
  T extends HandlerFunction<any, infer R, any> ? R : never;

// Base builder type without the handler methods
type ProcedureBuilderBase<TInput, TOutput, TContext> = {
  description: (
    description: string
  ) => ProcedureBuilder<TInput, TOutput, TContext>;
  instructions: (
    instructions: string
  ) => ProcedureBuilder<TInput, TOutput, TContext>;
  input: <TNewInput>(
    schema: z.ZodType<TNewInput>
  ) => ProcedureBuilder<TNewInput, TOutput, TContext>;
  output: <TNewOutput>(
    schema: z.ZodType<TNewOutput>
  ) => ProcedureBuilder<TInput, TNewOutput, TContext>;
  build: () => Procedure<TInput, TOutput, TContext>;
};

export type BaseProcedure<TInput, TOutput, TContext> = {
  _input: z.ZodType<TInput>;
  _output?: z.ZodType<TOutput>;
  _description: string | undefined;
  _instructions: string | undefined;
};

export type PromptProcedure<TInput, TOutput, TContext> = BaseProcedure<
  TInput,
  TOutput,
  TContext
> & {
  _handler: HandlerFunction<TInput, TOutput, TContext>;
  _type: "prompt";
};

export type ToolProcedure<TInput, TOutput, TContext> = BaseProcedure<
  TInput,
  TOutput,
  TContext
> & {
  _handler: HandlerFunction<TInput, TOutput, TContext>;
  _type: "tool";
};

export type ResourceProcedure<TInput, TOutput, TContext> = BaseProcedure<
  TInput,
  TOutput,
  TContext
> & {
  _handler: HandlerFunction<TInput, TOutput, TContext>;
  _type: "resource";
};

export type Procedure<TInput, TOutput, TContext> =
  | PromptProcedure<TInput, TOutput, TContext>
  | ToolProcedure<TInput, TOutput, TContext>
  | ResourceProcedure<TInput, TOutput, TContext>;

// Full builder type with specific return types for each handler
export type ProcedureBuilder<TInput, TOutput, TContext> = ProcedureBuilderBase<
  TInput,
  TOutput,
  TContext
> & {
  resource: <THandlerOutput = TOutput>(
    handler: HandlerFunction<TInput, THandlerOutput, TContext>
  ) => ResourceProcedure<TInput, THandlerOutput, TContext>;
  prompt: (
    handler: HandlerFunction<TInput, string, TContext>
  ) => PromptProcedure<TInput, string, TContext>;
  tool: <THandlerOutput = TOutput>(
    handler: HandlerFunction<TInput, THandlerOutput, TContext>
  ) => ToolProcedure<TInput, THandlerOutput, TContext>;
};

export class Router<TContext> {
  constructor(
    private ctx: TContext | (() => Promise<TContext>),
    private procedures: Record<string, Procedure<any, any, TContext>> = {}
  ) {}

  getProcedures() {
    return this.procedures;
  }

  public createCaller() {
    type CallerType = {
      [K in keyof typeof this.procedures]: (
        input: z.infer<(typeof this.procedures)[K]["_input"]>
      ) => Promise<
        (typeof this.procedures)[K]["_output"] extends z.ZodType<infer T>
          ? T
          : InferHandlerOutput<(typeof this.procedures)[K]["_handler"]>
      >;
    };

    return Object.entries(this.procedures).reduce(
      (caller, [name, procedure]) => {
        return {
          ...caller,
          [name]: async (input: any) => {
            const parsedInput = procedure._input.parse(input);
            const ctx =
              typeof this.ctx === "function"
                ? await (this.ctx as () => Promise<TContext>)()
                : this.ctx;
            const result = await procedure._handler({
              input: parsedInput,
              ctx,
            });
            return procedure._output ? procedure._output.parse(result) : result;
          },
        };
      },
      {} as CallerType
    );
  }

  extend(procedures: Record<string, Procedure<any, any, TContext>>) {
    this.procedures = { ...this.procedures, ...procedures };
    return this;
  }
}

export function createProcedureBuilder<
  TInput,
  TOutput,
  TContext,
>(): ProcedureBuilder<TInput, TOutput, TContext> {
  let inputSchema: z.ZodType<TInput> = z.any() as z.ZodType<TInput>;
  let outputSchema: z.ZodType<TOutput> | undefined = undefined;
  let inputDescription: string | undefined = undefined;
  let inputInstructions: string | undefined = undefined;
  let handlerType: "resource" | "prompt" | "tool" | undefined = undefined;
  let handler: HandlerFunction<TInput, any, TContext> | undefined = undefined;

  // Create the base builder
  const builder: ProcedureBuilder<TInput, TOutput, TContext> = {
    input: <TNewInput>(schema: z.ZodType<TNewInput>) => {
      inputSchema = schema as unknown as z.ZodType<TInput>;
      return builder as unknown as ProcedureBuilder<
        TNewInput,
        TOutput,
        TContext
      >;
    },
    output: <TNewOutput>(schema: z.ZodType<TNewOutput>) => {
      outputSchema = schema as unknown as z.ZodType<TOutput>;
      return builder as unknown as ProcedureBuilder<
        TInput,
        TNewOutput,
        TContext
      >;
    },
    description: (description: string) => {
      inputDescription = description;
      return builder;
    },
    instructions: (instructions: string) => {
      inputInstructions = instructions;
      return builder;
    },
    build: () => {
      if (!handlerType || !handler) {
        throw new Error(
          "You must specify a handler type (resource, prompt, or tool) before building"
        );
      }

      const baseProcedure = {
        _input: inputSchema,
        _output: outputSchema,
        _description: inputDescription,
        _instructions: inputInstructions,
        _handler: handler,
      };

      switch (handlerType) {
        case "resource":
          return {
            ...baseProcedure,
            _type: "resource",
          } as ResourceProcedure<TInput, any, TContext>;
        case "prompt":
          return {
            ...baseProcedure,
            _type: "prompt",
          } as PromptProcedure<TInput, any, TContext>;
        case "tool":
          return {
            ...baseProcedure,
            _type: "tool",
          } as ToolProcedure<TInput, any, TContext>;
      }
    },
    resource: <THandlerOutput = TOutput>(
      handlerFn: HandlerFunction<TInput, THandlerOutput, TContext>
    ): ResourceProcedure<TInput, THandlerOutput, TContext> => {
      handler = handlerFn as HandlerFunction<TInput, any, TContext>;
      handlerType = "resource";
      return {
        _input: inputSchema,
        _output: outputSchema as unknown as z.ZodType<THandlerOutput>,
        _description: inputDescription,
        _instructions: inputInstructions,
        _handler: handlerFn,
        _type: "resource",
      };
    },
    prompt: (
      handlerFn: HandlerFunction<TInput, string, TContext>
    ): PromptProcedure<TInput, string, TContext> => {
      // Validate that the input schema represents a flat object
      if (!isSchemaFlatObject(inputSchema)) {
        throw new Error(
          `Prompt procedures must use a flat object input schema. ` +
            `The current input schema contains nested objects, arrays, or other complex types. ` +
            `Only primitive types (string, number, boolean, null) and their optional/nullable variants are allowed.`
        );
      }

      handler = handlerFn as HandlerFunction<TInput, any, TContext>;
      handlerType = "prompt";
      return {
        _input: inputSchema,
        _output: z.string() as unknown as z.ZodType<string>,
        _description: inputDescription,
        _instructions: inputInstructions,
        _handler: handlerFn,
        _type: "prompt",
      };
    },
    tool: <THandlerOutput = TOutput>(
      handlerFn: HandlerFunction<TInput, THandlerOutput, TContext>
    ): ToolProcedure<TInput, THandlerOutput, TContext> => {
      handler = handlerFn as HandlerFunction<TInput, any, TContext>;
      handlerType = "tool";
      return {
        _input: inputSchema,
        _output: outputSchema as unknown as z.ZodType<THandlerOutput>,
        _description: inputDescription,
        _instructions: inputInstructions,
        _handler: handlerFn,
        _type: "tool",
      };
    },
  };

  return builder;
}

export async function toolRouterMcpserverAdapter(
  router: Router<any>,
  request: any
) {
  console.log(`[TOOL MCP SERVER ADAPTER] Request: ${JSON.stringify(request)}`);
  const parsedRequest = CallToolRequestSchema.parse(request);
  console.log(
    `[${parsedRequest.params.name}] Request Tool: ${JSON.stringify(parsedRequest)}`
  );

  const caller = router.createCaller();

  const func = caller[parsedRequest.params.name];

  if (!func) {
    throw new Error(`Function ${request.params.name} not found`);
  }

  const result = await func(parsedRequest.params.arguments);

  console.log(
    `[${parsedRequest.params.name}] Result: ${JSON.stringify(result)}`
  );

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

export async function resourceRouterMcpserverAdapter(
  router: Router<any>,
  request: any
) {
  console.log(
    `[RESOURCE MCP SERVER ADAPTER] Request: ${JSON.stringify(request)}`
  );

  const caller = router.createCaller();

  const uri = request.params.uri;
  const { path, args } = splitURI(uri);

  if (!path) {
    throw new Error(`Function ${request.params.name} not found`);
  }
  const func = caller[path];

  if (!func) {
    throw new Error(`Function ${request.params.name} not found`);
  }

  const result = await func(args);

  console.log(`[${path}] Result: ${JSON.stringify(result)}`);

  return {
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

export async function promptRouterMcpserverAdapter(
  router: Router<any>,
  request: any
) {
  console.log(
    `[PROMPT MCP SERVER ADAPTER] Request Prompt: ${JSON.stringify(request)}`
  );
  const parsedRequest = GetPromptRequestSchema.parse(request);
  console.log(
    `[${parsedRequest.params.name}] Request Prompt: ${JSON.stringify(parsedRequest)}`
  );

  const caller = router.createCaller();

  const func = caller[parsedRequest.params.name];

  if (!func) {
    throw new Error(`Function ${request.params.name} not found`);
  }

  const result = await func(parsedRequest.params.arguments);

  console.log(
    `[${parsedRequest.params.name}] Result: ${JSON.stringify(result)}`
  );

  return {
    messages: [
      {
        role: "assistant",
        content: {
          type: "text",
          text: result,
        },
      },
    ],
  };
}
