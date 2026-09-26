import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  // standalone: true,
  imports: [CommonModule],
  styleUrl: './footer.css',
  templateUrl: './footer.html',
})
export class FooterComponent {
  authors = [
    { name: 'Luigi Gonçalves Buono', github: 'https://github.com/Luigi-GB' },
    { name: 'Luiz Cruz', github: 'https://github.com/ladjc' },
  ];

  anoAtual = new Date().getFullYear();
}
