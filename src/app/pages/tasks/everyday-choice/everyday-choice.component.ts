import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UploadDataService } from 'src/app/services/uploadData.service';
import { TaskManagerService } from '../../../services/task-manager.service';
import { AuthService } from '../../../services/auth.service';
import { SnackbarService } from '../../../services/snackbar.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Role } from 'src/app/models/InternalDTOs';
declare function setFullScreen(): any;

@Component({
  selector: 'app-everyday-choice',
  templateUrl: './everyday-choice.component.html',
  styleUrls: ['./everyday-choice.component.scss']
})
export class EverydayChoiceComponent implements OnInit {

  userID: string;
  isScored: boolean | number = true;
  showFeedbackAfterEveryTrial: boolean | number = false;
  showScoreAfterEveryTrial: boolean | number = false;
  numberOfBreaks: number = 0;
  maxResponseTime: number = 2000;        // In milliseconds
  durationOfFeedback: number;    // In milliseconds
  interTrialDelay: number = 1000;       // In milliseconds
  practiceTrials: number;
  actualTrials: number;

  set: number;

  constructor(
    private router: Router,
    private uploadDataService: UploadDataService,
    private taskManager: TaskManagerService,
    private snackbarService: SnackbarService,
    private authService: AuthService
  ) { }

  
  ngOnInit() {
    const decodedToken = this.authService.getDecodedToken()
    if(!this.taskManager.hasExperiment() && decodedToken.Role !== Role.ADMIN) {
      this.router.navigate(['/login/mturk'])
      this.snackbarService.openErrorSnackbar("Refresh has occurred")
    }
    /*this.set = Math.floor(Math.random() * 4) + 1; */
    const jwt = this.authService.getDecodedToken()
    this.userID = jwt.UserID
  }


}
