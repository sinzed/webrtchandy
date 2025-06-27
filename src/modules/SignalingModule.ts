import readline from 'readline';

export class SignalingModule {
  static async getRemoteAnswer(): Promise<string> {
    return new Promise((resolve) => {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      rl.question('Paste remote answer JSON:\n', (answerStr: string) => {
        rl.close();
        resolve(answerStr);
      });
    });
  }

  static printOffer(offer: unknown) {
    console.log('--- COPY THIS OFFER TO REMOTE ---');
    console.log(JSON.stringify(offer));
    console.log('--- END OFFER ---');
  }
} 