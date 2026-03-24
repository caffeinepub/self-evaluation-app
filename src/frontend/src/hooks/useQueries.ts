import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EvaluationInput } from "../backend.d";
import { useActor } from "./useActor";

export function useGetPastEvaluations() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["evaluations"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPastEvaluations();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitEvaluation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: EvaluationInput) => {
      if (!actor) throw new Error("Actor not available");
      return actor.submitEvaluation(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
    },
  });
}
