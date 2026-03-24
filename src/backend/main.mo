import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Principal "mo:core/Principal";

actor {
  type Evaluation = {
    id : Nat;
    timestamp : Int;
    gripStrength : Nat;
    morningMobility : Nat;
    longTermMemory : Nat;
    perspirationAfterWalking : Nat;
    socialEngagement : Nat;
    skinCondition : Nat;
  };

  type EvaluationInput = {
    gripStrength : Nat;
    morningMobility : Nat;
    longTermMemory : Nat;
    perspirationAfterWalking : Nat;
    socialEngagement : Nat;
    skinCondition : Nat;
  };

  let evaluations = Map.empty<Principal, List.List<Evaluation>>();

  public shared ({ caller }) func submitEvaluation(input : EvaluationInput) : async () {
    let currentTime = Time.now();

    let newEvaluation : Evaluation = {
      id = currentTime.toNat();
      timestamp = currentTime;
      gripStrength = input.gripStrength;
      morningMobility = input.morningMobility;
      longTermMemory = input.longTermMemory;
      perspirationAfterWalking = input.perspirationAfterWalking;
      socialEngagement = input.socialEngagement;
      skinCondition = input.skinCondition;
    };

    let existingEvaluations = switch (evaluations.get(caller)) {
      case (null) { List.empty<Evaluation>() };
      case (?evals) { evals };
    };

    existingEvaluations.add(newEvaluation);
    evaluations.add(caller, existingEvaluations);
  };

  public query ({ caller }) func getPastEvaluations() : async [Evaluation] {
    switch (evaluations.get(caller)) {
      case (null) { [] };
      case (?evals) { evals.toArray() };
    };
  };
};
