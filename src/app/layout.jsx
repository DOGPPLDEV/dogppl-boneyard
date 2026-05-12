import './globals.css';

export const metadata = {
  title: 'The Boneyard — DOG PPL',
  description: 'DOG PPL · Concept Vault',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
