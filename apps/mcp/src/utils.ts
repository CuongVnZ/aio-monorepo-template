import { z } from "zod";

export const zodKeys = <T extends z.ZodTypeAny>(
  schema: T
): {
  name: string;
  description?: string;
  required: boolean;
}[] => {
  // make sure schema is not null or undefined
  if (schema === null || schema === undefined) return [];
  // check if schema is nullable or optional
  if (schema instanceof z.ZodNullable || schema instanceof z.ZodOptional)
    return zodKeys(schema.unwrap());
  // check if schema is an array
  if (schema instanceof z.ZodArray) return zodKeys(schema.element);
  // check if schema is an object
  if (schema instanceof z.ZodObject) {
    // get key/value pairs from schema
    const entries = Object.entries(
      schema.shape as Record<string, z.ZodTypeAny>
    );
    // loop through key/value pairs
    return entries.flatMap(([key, value]) => {
      // get nested keys
      const nested =
        value instanceof z.ZodType
          ? zodKeys(value).map((subKey) => ({
              name: `${key}.${subKey}`,
              description: subKey.description,
              required: subKey.required,
            }))
          : [];

      return nested.length
        ? nested
        : [
            {
              name: key,
              description: value?._def.description,
              required: false,
            },
          ];
    });
  }
  // return empty array
  return [];
};

// Helper function to check if a schema represents a flat object
export function isSchemaFlatObject(schema: z.ZodType<any>): boolean {
  if ((schema._def as any).typeName === "ZodObject") {
    const shape = (schema as z.ZodObject<any>)._def.shape();
    return Object.values(shape).every((fieldSchema: any) => {
      const typeName = (fieldSchema._def as any).typeName;
      return (
        typeName === "ZodString" ||
        typeName === "ZodNumber" ||
        typeName === "ZodBoolean" ||
        typeName === "ZodNull" ||
        (typeName === "ZodOptional" &&
          isSchemaFlatObject(fieldSchema._def.innerType)) ||
        (typeName === "ZodNullable" &&
          isSchemaFlatObject(fieldSchema._def.innerType))
      );
    });
  }
  if ((schema._def as any).typeName === "ZodRecord") {
    const valueSchema = (schema as z.ZodRecord<any>)._def.valueType;
    const valueTypeName = (valueSchema._def as any).typeName;
    return (
      valueTypeName === "ZodString" ||
      valueTypeName === "ZodNumber" ||
      valueTypeName === "ZodBoolean" ||
      valueTypeName === "ZodNull" ||
      (valueTypeName === "ZodUnion" &&
        valueSchema._def.options.every((opt: any) => {
          const optTypeName = (opt._def as any).typeName;
          return (
            optTypeName === "ZodString" ||
            optTypeName === "ZodNumber" ||
            optTypeName === "ZodBoolean" ||
            optTypeName === "ZodNull"
          );
        }))
    );
  }
  return false;
}
