import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deve listar os autores com o link do GitHub de cada um', () => {
    const el = fixture.nativeElement as HTMLElement;
    const links = Array.from(el.querySelectorAll('a[aria-label^="GitHub de"]')) as HTMLAnchorElement[];

    expect(links.length).toBe(component.authors.length);
    component.authors.forEach((autor, i) => {
      expect(el.textContent).toContain(autor.name);
      expect(links[i].href).toBe(autor.github);
      expect(links[i].target).toBe('_blank');
    });
  });
});
