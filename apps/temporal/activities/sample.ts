export type SampleActivity = ReturnType<typeof getSampleActivity>;
export const getSampleActivity = () => {
  return async (input: {
    message: string;
  }): Promise<{
    message: string;
  }> => {
    console.log("SampleActivity", input);
    return {
      message: input.message,
    };
  };
};
