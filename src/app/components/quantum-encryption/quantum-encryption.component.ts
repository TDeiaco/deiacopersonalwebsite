import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ml_kem768 } from '@noble/post-quantum/ml-kem.js';

@Component({
  selector: 'app-quantum-encryption',
  standalone: true,
  imports: [FormsModule, NgIf],
  templateUrl: './quantum-encryption.component.html',
  styleUrl: './quantum-encryption.component.css'
})
export class QuantumEncryptionComponent {
  plainText = '';
  cipherText = '';
  recipientPublicKeyText = '';
  kemCipherText = '';
  nonceText = '';
  encryptedBundleText = '';
  showInternals = false;

  decryptPrivateKeyText = '';
  decryptBundleText = '';
  decryptedText = '';

  privateKeyText = '';

  statusMessage = 'Generate a lattice key pair, paste text, then encrypt to the public key.';
  errorMessage = '';

  toggleInternals(): void {
    this.showInternals = !this.showInternals;
  }

  async generateKeySet(): Promise<void> {
    const keys = ml_kem768.keygen();
    const nonceBytes = crypto.getRandomValues(new Uint8Array(12));

    this.recipientPublicKeyText = this.bytesToBase64(keys.publicKey);
    this.privateKeyText = this.bytesToBase64(keys.secretKey);
    this.nonceText = this.bytesToBase64(nonceBytes);
    this.decryptPrivateKeyText = this.privateKeyText;
    this.errorMessage = '';
    this.statusMessage = 'Fresh ML-KEM-768 public and private keys generated.';
  }

  async encryptMessage(): Promise<void> {
    this.errorMessage = '';

    if (!this.plainText.trim()) {
      this.errorMessage = 'Enter text to encrypt first.';
      return;
    }

    if (!this.recipientPublicKeyText || !this.privateKeyText || !this.nonceText) {
      await this.generateKeySet();
    }

    try {
      const publicKey = this.base64ToBytes(this.recipientPublicKeyText);
      const { cipherText: encapsulatedKey, sharedSecret } = ml_kem768.encapsulate(publicKey);
      const key = await this.importAesKey(this.bytesToBase64(sharedSecret), ['encrypt']);
      const nonce = this.base64ToBytes(this.nonceText);
      const encoded = new TextEncoder().encode(this.plainText);
      const cipherBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: nonce },
        key,
        encoded
      );

      this.cipherText = this.bytesToBase64(new Uint8Array(cipherBuffer));
      this.kemCipherText = this.bytesToBase64(encapsulatedKey);
      this.encryptedBundleText = this.createBundle(this.cipherText, this.kemCipherText, this.nonceText);
      this.decryptBundleText = this.encryptedBundleText;
      this.decryptPrivateKeyText = this.privateKeyText;
      this.decryptedText = '';
      this.statusMessage = 'Message encrypted. Share the encrypted bundle and keep the private key with the receiver.';
    } catch {
      this.errorMessage = 'Encryption failed. Check the recipient public key and nonce values.';
    }
  }

  async decryptMessage(): Promise<void> {
    this.errorMessage = '';

    if (!this.decryptBundleText || !this.decryptPrivateKeyText) {
      this.errorMessage = 'Paste the encrypted bundle and private key before decrypting.';
      return;
    }

    try {
      const parsedBundle = this.parseBundle(this.decryptBundleText);
      const kemCipherBytes = this.base64ToBytes(parsedBundle.capsule);
      const privateKey = this.base64ToBytes(this.decryptPrivateKeyText);
      const sharedSecret = ml_kem768.decapsulate(kemCipherBytes, privateKey);
      const key = await this.importAesKey(this.bytesToBase64(sharedSecret), ['decrypt']);
      const nonce = this.base64ToBytes(parsedBundle.nonce);
      const cipherBytes = this.base64ToBytes(parsedBundle.ciphertext);
      const plainBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: nonce },
        key,
        cipherBytes
      );

      this.decryptedText = new TextDecoder().decode(plainBuffer);
      this.statusMessage = 'Message decrypted successfully.';
    } catch {
      this.errorMessage = 'Decryption failed. The encrypted bundle or private key does not match.';
    }
  }

  async copyField(value: string, label: string): Promise<void> {
    this.errorMessage = '';

    if (!value.trim()) {
      this.errorMessage = `Nothing to copy for ${label}.`;
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      this.statusMessage = `${label} copied.`;
    } catch {
      this.errorMessage = `Could not copy ${label}.`;
    }
  }

  private createBundle(ciphertext: string, capsule: string, nonce: string): string {
    return JSON.stringify({
      version: 'ml-kem-768+a256gcm',
      ciphertext,
      capsule,
      nonce
    }, null, 2);
  }

  private parseBundle(bundleText: string): { ciphertext: string; capsule: string; nonce: string } {
    const parsed = JSON.parse(bundleText) as Partial<{
      ciphertext: string;
      capsule: string;
      nonce: string;
    }>;

    if (!parsed.ciphertext || !parsed.capsule || !parsed.nonce) {
      throw new Error('Invalid bundle');
    }

    return {
      ciphertext: parsed.ciphertext,
      capsule: parsed.capsule,
      nonce: parsed.nonce
    };
  }

  private async importAesKey(keyText: string, usages: KeyUsage[]): Promise<CryptoKey> {
    const keyBytes = this.base64ToBytes(keyText);

    if (keyBytes.byteLength !== 32) {
      throw new Error('Invalid key length');
    }

    return crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, usages);
  }

  private bytesToBase64(bytes: Uint8Array): string {
    let binary = '';

    bytes.forEach((value) => {
      binary += String.fromCharCode(value);
    });

    return btoa(binary);
  }

  private base64ToBytes(value: string): Uint8Array {
    const normalized = value.trim();
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return bytes;
  }
}