import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  phoneNumber(value: string){
    console.log(`Phone Number: ${value}`);
  }

  date(value: string) {
    console.log(`Date: ${value}`);
  }

  creditCard(value: string) {
    console.log(`Credit Card: ${value}`)
  }
}
