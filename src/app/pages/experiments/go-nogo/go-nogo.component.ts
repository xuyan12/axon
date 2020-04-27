import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from 'src/app/services/data.service';
declare function setFullScreen(): any;

@Component({
  selector: 'app-go-nogo',
  templateUrl: './go-nogo.component.html',
  styleUrls: ['./go-nogo.component.scss']
})
export class GoNogoComponent implements OnInit {

  // Default Experiment config 
  isScored: boolean | number = true;
  showFeedbackAfterEveryTrial: boolean | number = true;
  showScoreAfterEveryTrial: boolean | number = true;
  numberOfBreaks: number = 2;
  maxResponseTime: number = 800;        // In milliseconds
  durationOfFeedback: number = 500;    // In milliseconds
  interTrialDelay: number = 1000;       // In milliseconds
  practiceTrials: number = 10;
  actualTrials: number = 30;

  step: number = 1;
  color: string = '';
  feedback: string = '';
  scoreForSpecificTrial: number = 0;
  totalScore: number = 0;
  isPractice: boolean = false;
  isStimulus: boolean = false;
  isBreak: boolean = false;
  currentTrial: number = 0;
  isResponseAllowed: boolean = false;
  data: {
    actualAnswer: string,
    userAnswer: string,
    responseTime: number,
    isCorrect: number,
    score: number
  }[] = [];
  timer: {
    started: number,
    ended: number
  } = {
      started: 0,
      ended: 0
    };
  showFixation: boolean = false;
  sTimeout: any;
  feedbackShown: boolean = false;

  @HostListener('window:keypress', ['$event'])
  onKeyPress(event: KeyboardEvent) {
    if (this.isResponseAllowed) {
      this.isResponseAllowed = false;
      try {
        if (event.key === ' ') {
          this.timer.ended = new Date().getTime();
          this.data[this.data.length - 1].responseTime = Number(((this.timer.ended - this.timer.started) / 1000).toFixed(2));
          this.data[this.data.length - 1].userAnswer = 'responded';
          try {
            clearTimeout(this.sTimeout);
            this.showFeedback();
          } catch (error) {
          }
        }
      } catch (error) {
      }
    }
  }


  
  constructor(
    private router: Router,
    private dataService: DataService
  ) { }


  
  ngOnInit() {
    let route_split = this.router.url.split('/');
    let routePath = route_split[route_split.length - 1];
    let currentExperiment = this.dataService.getExperimentByRoute(routePath);
    this.isScored = currentExperiment.isScored
    this.showFeedbackAfterEveryTrial = currentExperiment.showFeedbackAfterEveryTrial
    this.showScoreAfterEveryTrial = currentExperiment.showScoreAfterEveryTrial
    this.numberOfBreaks = currentExperiment.numberOfBreaks
    this.maxResponseTime = currentExperiment.maxResponseTime
    this.durationOfFeedback = currentExperiment.durationOfFeedback
    this.interTrialDelay = currentExperiment.interTrialDelay
    this.practiceTrials = currentExperiment.practiceTrials
    this.actualTrials = currentExperiment.actualTrials
  }


  
  processConsent(consent: Boolean) {
    if (consent) {
      this.proceedtoNextStep();
    } else {
      this.router.navigate(['/dashboard']);
    }
  }


  
  proceedtoPreviousStep() {
    this.step -= 1;
  }


  
  proceedtoNextStep() {
    this.step += 1;
  }


  
  async startPractice() {
    this.startGameInFullScreen();
    this.resetData();
    this.proceedtoNextStep();
    await this.wait(2000);
    this.proceedtoNextStep();
    this.isPractice = true;
    this.currentTrial = 0;
    this.showStimulus();
  }


  
  async startActualGame() {
    this.resetData();
    this.proceedtoNextStep();
    await this.wait(2000);
    this.proceedtoNextStep();
    this.isPractice = false;
    this.currentTrial = 0;
    this.showStimulus();
  }


  
  async showStimulus() {

    this.reset();
    this.showFixation = true;
    await this.wait(500);
    this.showFixation = false;
    await this.wait(200);

    this.currentTrial += 1;
    this.generateStimulus();
    this.isStimulus = true;
    this.isResponseAllowed = true;

    this.timer.started = new Date().getTime();
    this.timer.ended = 0;

    console.log(this.isPractice ? `Practice trial: ${this.currentTrial}` : `Actual trial: ${this.currentTrial}`);

    // This is the delay between showing the stimulus and showing the feedback
    this.sTimeout = setTimeout(() => {
      if (!this.feedbackShown) {
        this.showFeedback();
      }
    }, this.maxResponseTime);
  }


  
  generateStimulus() {
    const random = Math.random();
    if (random < 0.5) {
      this.color = 'green';
      this.data.push({
        actualAnswer: 'responded',
        userAnswer: 'not-responded',
        responseTime: 0,
        isCorrect: 0,
        score: 0
      });
    } else {
      this.color = 'orange';
      this.data.push({
        actualAnswer: 'not-responded',
        userAnswer: 'not-responded',
        responseTime: 0,
        isCorrect: 0,
        score: 0
      });
    }
  }


  
  async showFeedback() {
    this.feedbackShown = true;
    this.isStimulus = false;
    this.isResponseAllowed = false;

    if (this.data[this.data.length - 1].responseTime === 0) {
      this.timer.ended = new Date().getTime();
      this.data[this.data.length - 1].responseTime = Number(((this.timer.ended - this.timer.started) / 1000).toFixed(2));
    }

    if (this.data[this.data.length - 1].actualAnswer === this.data[this.data.length - 1].userAnswer) {
      this.feedback = "Correct";
      this.data[this.data.length - 1].isCorrect = 1;
      this.data[this.data.length - 1].score = 10;
      this.scoreForSpecificTrial = 10;
      this.totalScore += 10;
    } else {
      if (this.data[this.data.length - 1].userAnswer === 'responded') {
        this.feedback = "Incorrect";
      } else {
        this.feedback = "Too slow";
      }
      this.data[this.data.length - 1].isCorrect = 0;
      this.data[this.data.length - 1].score = 0;
      this.scoreForSpecificTrial = 0;
    }

    if (this.showFeedbackAfterEveryTrial || this.isPractice) {
      await this.wait(this.durationOfFeedback);
    }
    this.decideToContinue();
  }


  
  async decideToContinue() {
    if (this.isPractice) {
      if (this.currentTrial < this.practiceTrials) {
        this.continueGame();
      } else {
        this.proceedtoNextStep();
        await this.wait(2000);
        this.proceedtoNextStep();
      }
    } else {
      if (this.currentTrial < this.actualTrials) {
        if (this.numberOfBreaks === 0) {
          this.continueGame();
        } else {
          let breakAtTrailIndices = [];
          let setSize = this.actualTrials / (this.numberOfBreaks + 1);
          for (let i = 1; i < this.numberOfBreaks + 1; i++) {
            breakAtTrailIndices.push(setSize * i);
          }
          if (breakAtTrailIndices.includes(this.currentTrial)) {
            this.isBreak = true;
          } else {
            this.isBreak = false;
            this.continueGame();
          }
        }
      } else {
        this.proceedtoNextStep();
        await this.wait(2000);
        this.proceedtoNextStep();
        console.log(this.data);
      }
    }
  }


  
  resume() {
    this.reset();
    this.isBreak = false;
    this.continueGame();
  }


  
  async continueGame() {
    await this.wait(this.interTrialDelay);
    this.showStimulus();
  }


  
  uploadResults() {
  }


  
  continueAhead() {
    this.router.navigate(['/dashboard']);
  }



  
  reset() {
    this.color = '';
    this.feedback = '';
    this.feedbackShown = false;
    this.scoreForSpecificTrial = 0;
  }


  
  resetData() {
    this.data = [];
    this.totalScore = 0;
  }


  
  startGameInFullScreen() {
    setFullScreen();
  }


  
  wait(time: number): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  }

}
