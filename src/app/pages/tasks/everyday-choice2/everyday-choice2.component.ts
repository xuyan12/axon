import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { UploadDataService } from 'src/app/services/uploadData.service';
import { TaskManagerService } from '../../../services/task-manager.service';
import { AuthService } from '../../../services/auth.service';
import { SnackbarService } from '../../../services/snackbar.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Role } from 'src/app/models/InternalDTOs';
import { choiceTask } from '../../../models/TaskData';
//import { pracSet } from './stimuli_practice';
import { activityPair,  pracSet } from './stimuli_task';
import { activityList } from './activityList';


declare function setFullScreen(): any;

@Component({
  selector: 'app-everyday-choice2',
  templateUrl: './everyday-choice2.component.html',
  styleUrls: ['./everyday-choice2.component.scss']
})
export class EverydayChoice2Component implements OnInit {

  userID: string;
  isScored: boolean | number = false;
  showFeedbackAfterEveryTrial: boolean | number = false;
  showScoreAfterEveryTrial: boolean | number = false;
  numberOfBreaks: number = 0;
  maxResponseTime: number = 20000;       //CHANGE TO 30000 // In milliseconds
  durationOfFeedback: number;    // In milliseconds
  interTrialDelay: number = 1000;       // In milliseconds
  practiceTrials: number = 1;
  actualTrials: number = 45;  //change into number of activities
  delayToShowHelpMessage: number = 4000; //delay to show help message, change to 10000
  durationHelpMessageShown: number = 6000;

  step: number = 1;
  activityDict: string[]; //dictionary/pool of acitivities, i.e. if activityX is to appear twice throughout the task, it appears twice in the dictionary 
  currentSet: activityPair[]; //the stimulus set of choice pairs currently used (can be practice or task)
  currentTaskset: activityPair[];
  currentPracSet: activityPair[];
  currentPairs: activityPair[] = [];
  currentActivityPair: activityPair;
  //currentActivityPairOrdered: activityPair;
  currentActivityLeft: string = '';
  currentActivityRight: string = '';

  isPractice: boolean = false;
  isStimulus: boolean = false;
  isRatingscale: boolean = false;
  isBreak: boolean = false;
  currentTrial: number = 0;
  isResponseAllowed: boolean = false;
  data: choiceTask[] = [];
  timer: {
    started: number,
    ended: number
  } = {
      started: 0,
      ended: 0
    };
  //set: number;
  //counterbalance: number;
  showFixation: boolean = false;
  sTimeout: any;
  feedbackShown: boolean = false;
  snackbarTimeout: any;

  @HostListener('window:keypress', ['$event'])
  onKeyPress(event: KeyboardEvent) {
    if (this.isResponseAllowed) {
      this.isResponseAllowed = false;
      try {
        if (!!event.key) {
          this.timer.ended = new Date().getTime();
          this.data[this.data.length - 1].responseTime = Number(((this.timer.ended - this.timer.started) / 1000).toFixed(2)); //what is this
          switch (event.key) {
            case '1': this.data[this.data.length - 1].userAnswer = 1; break;
            case '2': this.data[this.data.length - 1].userAnswer = 2; break;
            case '3': this.data[this.data.length - 1].userAnswer = 3; break;
            case '4': this.data[this.data.length - 1].userAnswer = 4; break;
            case '5': this.data[this.data.length - 1].userAnswer = 5; break;
            //default: this.data[this.data.length - 1].userAnswer = ''; break;
          }
          try {
            this.cancelHelpMessage();
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
    private uploadDataService: UploadDataService,
    private taskManager: TaskManagerService,
    private snackbarService: SnackbarService,
    private authService: AuthService
  ) { }

  ngOnInit() {

    const decodedToken = this.authService.getDecodedToken()
    //this.counterbalance = Math.floor(Math.random() * 2); //returns 0 or 1
    if (!this.taskManager.hasExperiment() && decodedToken.Role !== Role.ADMIN) {
      this.router.navigate(['/login/mturk'])
      this.snackbarService.openErrorSnackbar("Refresh has occurred")
    }

    const jwt = this.authService.getDecodedToken()
    this.userID = jwt.UserID
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
    this.currentPracSet = this.shuffleStimulus(pracSet);
    this.proceedtoNextStep();
    this.isPractice = true;
    this.currentTrial = 0;
    this.showStimulus();
  }



  async startActualGame() {
    this.resetData();
    this.currentTaskset = this.semiRandomSet();
    this.proceedtoNextStep();
    await this.wait(2000);
    this.proceedtoNextStep();
    this.isPractice = false;
    this.currentTrial = 0;  
    this.showStimulus();
  }
  async showStimulus() {

    this.reset();
    this.showFixation = false;
    await this.wait(500);


    this.currentTrial += 1;
    this.generateStimulus();


    this.isStimulus = true;
    await this.wait(1500);
    this.isRatingscale = true;
    this.isResponseAllowed = true;

    this.timer.started = new Date().getTime();
    this.timer.ended = 0;

    this.showHelpMessage("Please make the rating by pressing the corresponding number key", this.delayToShowHelpMessage, this.durationHelpMessageShown); /*, this.durationHelpMessageShown*/

    // This is the delay between showing the stimulus and showing the feedback
    this.sTimeout = setTimeout(() => {
      if (!this.feedbackShown) {
        this.showFeedback();
      }
    }, this.maxResponseTime);

  }


  private showHelpMessage(helpMessage: string, delay: number, duration: number) { //, duration: number
    this.snackbarTimeout = setTimeout(() => {
      this.snackbarService.openInfoSnackbar(helpMessage, "", duration);
    }, delay)
    /*this.snackbarTimeout = setTimeout(() => {
      alert(helpMessage);
    }, delay) */
  }

  private cancelHelpMessage() {
    this.snackbarService.clearSnackbar();
    clearTimeout(this.snackbarTimeout);
  }



  private shuffleStimulus(array) { //: Array<activityPair>) : Array<activityPair> {
    let currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }

  private semiRandomSet() {
    
    /* 
    let currentPairs = new Array<activityPair>();
    let currentTaskSet = this.shuffleStimulus(taskSet);
    console.log(currentTaskSet);

    while (this.activityDict.length > 0) { //this.currentPairs.length < this.actualTrials
      if (currentTaskSet.length == 0) throw new Error("currentTaskSet must not be empty");  
      let tempPair = currentTaskSet.shift(); //take the first pair from the shuffled taskSet
      console.log(tempPair.activityA)
      if (this.activityDict.includes(tempPair.activityA) && this.activityDict.includes(tempPair.activityB)) {
        currentPairs.push(tempPair)
        let index0 = this.activityDict.indexOf(tempPair.activityA);
        if (index0 > -1) {
          this.activityDict.splice(index0, 1);
        }
        let index1 = this.activityDict.indexOf(tempPair.activityB);
        if (index1 > -1) {
          this.activityDict.splice(index1, 1);
        }
      }
      console.log(this.activityDict);
    } */
   
    //if each activity is shown twice; else this.activityDict = activityList
    this.activityDict = activityList.concat(activityList);
    

    while (this.currentPairs.length < this.actualTrials) {

      let tempA = this.activityDict[Math.floor(Math.random() * this.activityDict.length)];
      let tempB = this.activityDict[Math.floor(Math.random() * this.activityDict.length)];
      if (tempA != tempB) {
        let tempPair = new activityPair(tempA, tempB);
        //console.log(tempPair); //delete
        let pairDuplicated = this.currentPairs.find(x => (x.activityA == tempA && x.activityB == tempB)|| (x.activityA == tempB && x.activityB == tempA));
        //let tempBoolean = currentPairs.includes(new activityPair(tempB, tempA)) || currentPairs.includes(tempPair);
        if (pairDuplicated == undefined){
          this.currentPairs.push(tempPair);
          let index0 = this.activityDict.indexOf(tempPair.activityA);
          if (index0 > -1) {
            this.activityDict.splice(index0, 1);
          }
          let index1 = this.activityDict.indexOf(tempPair.activityB);
          if (index1 > -1) {
            this.activityDict.splice(index1, 1);
          }
        }
        
      }
    }
    console.log(this.currentPairs); //delete
    return this.currentPairs;
  }


  generateStimulus() {


    if (this.isPractice == true) {
      this.currentSet = this.currentPracSet
    }
    else {
      this.currentSet = this.currentTaskset;
    }

    this.currentActivityPair = this.currentSet[this.currentTrial - 1];
    this.currentActivityLeft = this.currentActivityPair.activityA;
    this.currentActivityRight = this.currentActivityPair.activityB;
    /* var tempIndex = Math.floor(Math.random() * 2);
    if (tempIndex == 0) {
      this.currentActivityLeft = this.currentActivityPair.activityA;
      this.currentActivityRight = this.currentActivityPair.activityB;
    }
    else {
      this.currentActivityRight = this.currentActivityPair.activityA;
      this.currentActivityLeft = this.currentActivityPair.activityB;
    } */
    //this.currentActivityPairOrdered = this.shuffleStimulus(this.currentActivityPair);
    //this.currentActivityLeft = this.currentActivityPair[tempIndex];
    //this.currentActivityRight = this.currentActivityPair[tempIndex];


    this.data.push({
      trial: this.currentTrial,
      userID: this.userID,
      userAnswer: null,
      activityLeft: this.currentActivityLeft,
      activityRight: this.currentActivityRight,
      responseTime: 0,
      score: 0
    });
  }



  async showFeedback() {
    this.feedbackShown = true;
    this.isStimulus = false;
    this.isRatingscale = false;
    this.isResponseAllowed = false;

    if (this.data[this.data.length - 1].responseTime === 0) {
      this.data[this.data.length - 1].responseTime = this.maxResponseTime;
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
          const breakAtTrailIndices = [];
          const setSize = this.actualTrials / (this.numberOfBreaks + 1);
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
      }
      else {
        this.proceedtoNextStep();
        const decodedToken = this.authService.getDecodedToken()
        if (decodedToken.Role === Role.ADMIN) {
          this.proceedtoNextStep()
        } else {

          this.uploadResults(this.data).subscribe(ok => {
            if (ok) {
              this.proceedtoNextStep();
            } else {
              this.router.navigate(['/login/mturk'])
              console.error("There was an error uploading the results");
              this.snackbarService.openErrorSnackbar("There was an error uploading the results");
            }
          }, err => {
            this.router.navigate(['/login/mturk'])
            console.log("There was an error uploading the results");
            this.snackbarService.openErrorSnackbar("There was an error uploading the results");
          })

        }
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



  uploadResults(data: choiceTask[]): Observable<boolean> {
    const experimentCode = this.taskManager.getExperimentCode()
    return this.uploadDataService.uploadData(experimentCode, "ratingTask", data).pipe(
      map(ok => ok.ok)
    )
  }



  continueAhead() {
    const decodedToken = this.authService.getDecodedToken()
    if (decodedToken.Role === Role.ADMIN) {
      this.router.navigate(['/dashboard/tasks'])
      this.snackbarService.openInfoSnackbar("Task completed")
    } else {
      this.taskManager.nextExperiment()
    }
  }




  reset() {
    this.currentActivityLeft = '';
    this.currentActivityRight = '';
    this.feedbackShown = false;

  }



  resetData() {
    this.data = [];

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

