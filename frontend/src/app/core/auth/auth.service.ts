import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of, map } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  name: string;
  email: string;
  profile_picture?: string;
  auth_provider: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/auth`;

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.currentUser$.pipe(map(user => !!user));

  constructor() {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      this.currentUserSubject.next(JSON.parse(userJson));
    }
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  private setTokens(response: TokenResponse): void {
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    localStorage.setItem('user', JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
  }

  register(data: any): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(response => this.setTokens(response))
    );
  }

  login(data: any): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.apiUrl}/login`, data).pipe(
      tap(response => this.setTokens(response))
    );
  }

  googleLogin(idToken: string): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.apiUrl}/google`, { id_token: idToken }).pipe(
      tap(response => this.setTokens(response))
    );
  }

  refreshToken(): Observable<TokenResponse> {
    const refresh_token = this.getRefreshToken();
    if (!refresh_token) return of();
    
    return this.http.post<TokenResponse>(`${this.apiUrl}/refresh`, { refresh_token }).pipe(
      tap(response => this.setTokens(response))
    );
  }

  logout(): void {
    const refresh_token = this.getRefreshToken();
    if (refresh_token) {
      this.http.post(`${this.apiUrl}/logout`, { refresh_token }).subscribe({
        next: () => this.clearSession(),
        error: () => this.clearSession()
      });
    } else {
      this.clearSession();
    }
  }

  private clearSession(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }
}
