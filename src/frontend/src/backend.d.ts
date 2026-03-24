import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Evaluation {
    id: bigint;
    socialEngagement: bigint;
    longTermMemory: bigint;
    perspirationAfterWalking: bigint;
    gripStrength: bigint;
    timestamp: bigint;
    morningMobility: bigint;
    skinCondition: bigint;
}
export interface EvaluationInput {
    socialEngagement: bigint;
    longTermMemory: bigint;
    perspirationAfterWalking: bigint;
    gripStrength: bigint;
    morningMobility: bigint;
    skinCondition: bigint;
}
export interface backendInterface {
    getPastEvaluations(): Promise<Array<Evaluation>>;
    submitEvaluation(input: EvaluationInput): Promise<void>;
}
