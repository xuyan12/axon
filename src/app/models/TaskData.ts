export abstract class TaskData {
    trial: number;
    userID: string;
    score: number;
}

export interface Stimuli {
    set: any[]
}

export class StroopTask extends TaskData {
    actualAnswer:   string;
    userAnswer:     string;
    isCongruent:    boolean;
    responseTime:   number;
    isCorrect:      boolean;
    set:            number;
}

export class StroopTaskStimuli implements Stimuli {
    set: {
        trial: number;
        color: string;
        congruent: number;
        word: string;
    }[]
}

export class NBack extends TaskData {
    actualAnswer: string;
    userAnswer: string;
    responseTime: number;
    isCorrect: boolean;
    set: number;
}

export class NBackStimuli implements Stimuli {
    set: {
        trial: number;
        currentLetter: string;
        nback: string;
    }[]
}

export class TaskSwitching extends TaskData {
    color: string;
    digit: number;
    actualAnswer: string;
    userAnswer: string;
    responseTime: number;
    isCorrect: boolean;
}

export class ratingTask extends TaskData {
    counterbalance: number;
    ratingType: string; 
    trial: number; 
    activity: string;
    userAnswer: number;
    responseTime: number;

}

export class choiceTask extends TaskData {
    trial: number; 
    activityLeft: string;
    activityRight: string;
    userAnswer: number;
    responseTime: number;
}

