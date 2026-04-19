import { Component, inject, AfterViewInit, NgZone, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private ngZone = inject(NgZone);

  isLoginMode = true;
  isLoading = false;
  error: string | null = null;
  returnUrl = '/';
  showPassword = false;
  showConfirmPassword = false;
  googleAvailable = false;

  authForm: FormGroup;

  constructor() {
    this.authForm = this.fb.group({
      name: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['']
    });

    this.route.queryParams.subscribe(params => {
      this.returnUrl = params['returnUrl'] || '/';
    });
  }

  ngAfterViewInit(): void {
    this.initGoogleSignIn();
  }

  ngOnDestroy(): void {
    // Clean up google button if needed
  }

  private initGoogleSignIn(): void {
    if (!environment.googleClientId) {
      this.googleAvailable = false;
      return;
    }

    // Wait for the Google SDK to load
    const checkGoogle = setInterval(() => {
      if (typeof google !== 'undefined' && google.accounts) {
        clearInterval(checkGoogle);
        this.googleAvailable = true;

        google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: (response: any) => this.handleGoogleCallback(response),
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        google.accounts.id.renderButton(
          document.getElementById('google-signin-btn'),
          {
            theme: 'outline',
            size: 'large',
            width: '100%',
            shape: 'pill',
            text: 'continue_with',
            logo_alignment: 'center',
          }
        );
      }
    }, 100);

    // Stop checking after 5 seconds
    setTimeout(() => clearInterval(checkGoogle), 5000);
  }

  private handleGoogleCallback(response: any): void {
    this.ngZone.run(() => {
      this.isLoading = true;
      this.error = null;

      this.authService.googleLogin(response.credential).subscribe({
        next: () => {
          this.router.navigateByUrl(this.returnUrl);
        },
        error: (err) => {
          this.isLoading = false;
          this.error = err.error?.detail || 'Google sign-in failed. Please try again.';
        }
      });
    });
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.error = null;

    if (this.isLoginMode) {
      this.authForm.get('name')?.clearValidators();
      this.authForm.get('confirmPassword')?.clearValidators();
    } else {
      this.authForm.get('name')?.setValidators([Validators.required]);
      this.authForm.get('confirmPassword')?.setValidators([Validators.required]);
    }
    this.authForm.get('name')?.updateValueAndValidity();
    this.authForm.get('confirmPassword')?.updateValueAndValidity();
    this.authForm.reset();
  }

  get passwordMismatch(): boolean {
    if (this.isLoginMode) return false;
    const password = this.authForm.get('password')?.value;
    const confirmPassword = this.authForm.get('confirmPassword')?.value;
    return confirmPassword && password !== confirmPassword;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit() {
    if (this.authForm.invalid) {
      return;
    }

    if (!this.isLoginMode && this.passwordMismatch) {
      this.error = 'Passwords do not match.';
      return;
    }

    this.isLoading = true;
    this.error = null;

    const data = this.authForm.value;
    const authObservable = this.isLoginMode
      ? this.authService.login({ email: data.email, password: data.password })
      : this.authService.register({ name: data.name, email: data.email, password: data.password });

    authObservable.subscribe({
      next: () => {
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.detail || 'An error occurred during authentication.';
      }
    });
  }
}
