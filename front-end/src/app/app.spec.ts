import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  // O template não tem <h1>: a página é montada com menu, conteúdo da rota e rodapé
  it('deve renderizar o menu, a área das páginas e o rodapé', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('header.site-header app-nav')).not.toBeNull();
    expect(compiled.querySelector('.content-wrapper router-outlet')).not.toBeNull();
    expect(compiled.querySelector('footer app-footer')).not.toBeNull();
  });
});
