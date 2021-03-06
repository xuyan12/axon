import { Component, OnInit, OnDestroy } from '@angular/core';
import { Task } from 'src/app/models/Task';
import { MatDialogRef } from '@angular/material/dialog';
import { TasklistService } from 'src/app/services/tasklist.service';
import { FormBuilder, Validators } from '@angular/forms';
import { Experiment } from 'src/app/models/Experiment';
import { Subscription } from 'rxjs';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { SnackbarService } from '../../../../services/snackbar.service';

export enum ArrayChange {
  REMOVED,
  ADDED
}

export class ArrayChangeObject {
  change: ArrayChange;
  item: Task;
}

@Component({
  selector: 'app-create-experiment-dialog',
  templateUrl: './create-experiment-dialog.component.html',
  styleUrls: ['./create-experiment-dialog.component.scss']
})
export class CreateExperimentDialogComponent implements OnInit, OnDestroy {

  tasks: Task[] = [];
  completedTasks: string[] = [];
  selectedTasks: Task[] = [];

  private subscriptions: Subscription[] = [];

  experimentForm = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.maxLength(255)],
    tasks: [[], Validators.required]
  })

  constructor(
    public dialogRef: MatDialogRef<CreateExperimentDialogComponent>,
    private tasklistService: TasklistService,
    private fb: FormBuilder,
    private _snackbar: SnackbarService
  ) {}

  ngOnInit(): void {
    this.tasklistService.updateTasks()
    this.getTasklist()
    this.getCompletedTasklist()
    this.subscriptions.push(
      this.experimentForm.get("tasks").valueChanges.subscribe((tasks: Task[]) => {
        this.handleSelectChange(tasks)
      })
    )
  }

  handleSelectChange(newTasks: Task[]) {
    const change = this._findDifference(this.selectedTasks, newTasks)
    switch (change.change) {
      case ArrayChange.ADDED:
        this.selectedTasks.push(change.item)
        break;
      case ArrayChange.REMOVED:
        const indexOfRemovedItem = this.selectedTasks.findIndex(x => x.id === change.item.id)
        this.selectedTasks.splice(indexOfRemovedItem, 1)
        break;
      default:
        // we should never reach here
        console.error("ArrayChange option not found")
        this._snackbar.openErrorSnackbar("There was an error")
        break;
    }
  }

  // takes in 2 arrays and returns the single change between the two
  private _findDifference(oldArr: Task[], newArr: Task[]): ArrayChangeObject {
    // will either be 1 or -1 since only one change occurs at a time
    const sizeDiff = newArr.length - oldArr.length
    // element has been added to the array
    if(sizeDiff > 0) {
      // !<some-string> is false, !undefined is true so we search through
      // until we come across a string in newArr that is not found in oldArr
      const task = newArr.find(x => !oldArr.find(y => x.id === y.id))

      return {
        change: ArrayChange.ADDED,
        item: task
      }
    } else {
      // element has been removed from the array

      // same logic as above, but reversed
      const task = oldArr.find(x => !newArr.find(y => x.id === y.id))

      return {
        change: ArrayChange.REMOVED,
        item: task
      }
    }
  }

  private getCompletedTasklist(): void {
    this.subscriptions.push(
      this.tasklistService.completedTaskList.subscribe(completedTasks => {
        this.completedTasks = completedTasks
      })
    )
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.selectedTasks, event.previousIndex, event.currentIndex)
  }

  private getTasklist(): void {
    this.subscriptions.push(
        this.tasklistService.taskList.subscribe(tasklist => {
        this.tasks = tasklist
      })
    )
  }

  sendDataToParent() {
    const experiment = new Experiment(
      this.experimentForm.get("name").value,
      null, // code is populated in the backend
      this.experimentForm.get("description").value,
      this.selectedTasks.map(x => x.id)
    )
    this.dialogRef.close({experiment})
  }

  taskIsComplete(task: Task): boolean {
    if(this.completedTasks) {
      return this.completedTasks.includes(task.id) ? true : false
    } else {
      return false
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe())
  }
}
