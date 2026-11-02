import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const workspaceAuth = readFileSync('src/lib/googleWorkspace.ts', 'utf8');
const driveService = readFileSync('src/lib/gdrive.ts', 'utf8');

describe('Google Workspace authorization consistency', () => {
  it('uses one Workspace sign-in flow for Drive, Calendar, and Gmail', () => {
    expect(driveService).toContain("from './googleWorkspace'");
    expect(driveService).toContain('googleWorkspaceSignIn');
    expect(driveService).toContain('googleWorkspaceLogout');
    expect(driveService).not.toContain('signInWithPopup');
    expect(driveService).not.toContain('new GoogleAuthProvider');
  });

  it('never treats a legacy Drive-only token as a full Workspace token', () => {
    expect(workspaceAuth).toContain("sessionStorage.getItem('google_workspace_access_token')");
    expect(workspaceAuth).not.toContain("sessionStorage.getItem('gdrive_access_token')");
    expect(workspaceAuth).not.toContain("sessionStorage.setItem('gdrive_access_token'");
  });

  it('requests Gmail send and read-only Calendar scopes without Gmail read access', () => {
    expect(workspaceAuth).toContain('https://www.googleapis.com/auth/gmail.send');
    expect(workspaceAuth).toContain('https://www.googleapis.com/auth/calendar.readonly');
    expect(workspaceAuth).not.toContain('https://www.googleapis.com/auth/gmail.readonly');
    expect(workspaceAuth).not.toContain('https://www.googleapis.com/auth/calendar.events');
  });
});
