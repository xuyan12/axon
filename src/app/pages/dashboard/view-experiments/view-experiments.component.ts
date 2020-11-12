import { Component, OnInit } from '@angular/core';
import { Experiment } from 'src/app/models/Experiment';
import { ExperimentsService } from 'src/app/services/experiments.service';
import { MatDialog } from '@angular/material/dialog';
import { CreateExperimentDialogComponent } from './create-experiment-dialog/create-experiment-dialog.component';
import { HttpResponse } from '@angular/common/http';
import { ConfirmationService } from '../../../services/confirmation.service';
import { SnackbarService } from '../../../services/snackbar.service';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-view-experiments',
  templateUrl: './view-experiments.component.html',
  styleUrls: ['./view-experiments.component.scss']
})
export class ViewExperimentsComponent implements OnInit {

  PROD_LINK: string = "https://psharplab.campus.mcgill.ca/#/login/mturk?code=";
  DEV_LINK: string = "http://localhost:4200/#/login/mturk?code="
  SHOWN_LINK: string;

  constructor(
    private experimentsService: ExperimentsService,
    public dialog: MatDialog,
    private confirmationService: ConfirmationService,
    private snackbarService: SnackbarService,
  ) { }

  experiments: Observable<Experiment[]>;

  ngOnInit(): void {
    this.setLink()

    this.experiments = this.experimentsService.experiments
    this.updateExperiments()
  }

  openCreateExperimentDialog() {
    const dialogRef = this.dialog.open(CreateExperimentDialogComponent, {width: "30%"})

    dialogRef.afterClosed().subscribe((data: Experiment) => {      
      if(data) this._createExperiment(data);
    })
  }

  private updateExperiments() {
    this.experimentsService.updateExperiments()
  }

  private _createExperiment(experiment: Experiment) {
    this.experimentsService.createExperiment(experiment).subscribe(() => {
      this.updateExperiments()
    })
  }

  private setLink(): void {
    this.SHOWN_LINK = environment.production ? this.PROD_LINK : this.DEV_LINK
  }

  onDelete(code: string) {
    this.confirmationService.openConfirmationDialog(`Are you sure you want to delete experiment ${code}?`).subscribe(ok => {
      if(ok) this.deleteExperiment(code)
    })
  }

  private deleteExperiment(code: string) {
    this.experimentsService.deleteExperiment(code).subscribe((data: HttpResponse<any>) => {
      this.updateExperiments();
      this.snackbarService.openSuccessSnackbar(`Successfully deleted experiment ${code}`)
    })
  }

  showCopiedMessage() {
    this.snackbarService.openSuccessSnackbar("Copied to clipboard")
  }

}
