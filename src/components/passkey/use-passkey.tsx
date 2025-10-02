import { Button } from "@/components/ui/button";
import {
  signIn,
  WebAuthnSignInProgressStep,
  type SignProgress,
  type SignProgressFn,
} from "@junobuild/core";
import { useEffect, useState } from "react";
import { Progress } from "@/components/passkey/progress";
import { PasskeyProps } from "@/types/passkey";
import { useJuno } from "@/context/JunoContext";

export const UsePasskey = ({
  progress: wizardProgress,
  onProgress: wizardOnProgress,
}: PasskeyProps) => {
  const [progress, setProgress] = useState<
    SignProgress<WebAuthnSignInProgressStep> | undefined | null
  >(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const { initialize } = useJuno();

  const onProgress: SignProgressFn<WebAuthnSignInProgressStep> = (progress) =>
    wizardOnProgress({ signIn: progress });

  useEffect(() => {
    if (wizardProgress === undefined) {
      setProgress(undefined);
      return;
    }

    setProgress("signIn" in wizardProgress ? wizardProgress.signIn : null);
  }, [wizardProgress]);

  const doSignIn = async () => {
    try {
      setIsLoading(true);
      // Ensure Satellite is initialized before attempting sign in
      await initialize();
      await signIn({
        webauthn: {
          options: { onProgress },
        },
      });
    } catch (error: unknown) {
      wizardOnProgress(undefined);
      setIsLoading(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {progress === null ? (
        <></>
      ) : progress === undefined ? (
        <>
          <p className="pt-6">Already got one set-up?</p>

          <Button onClick={doSignIn} loading={isLoading}>
            Use your passkey
          </Button>
        </>
      ) : (
        <Progress>
          {progress?.step ===
            WebAuthnSignInProgressStep.RequestingUserCredential && (
            <span>Requesting user credential...</span>
          )}
          {progress?.step ===
            WebAuthnSignInProgressStep.FinalizingCredential && (
            <span>Finalizing credential...</span>
          )}
          {progress?.step === WebAuthnSignInProgressStep.Signing && (
            <span>Signing request...</span>
          )}
          {progress?.step === WebAuthnSignInProgressStep.FinalizingSession && (
            <span>Finalizing session...</span>
          )}
          {progress?.step === WebAuthnSignInProgressStep.RetrievingUser && (
            <span>Loading user...</span>
          )}
        </Progress>
      )}
    </>
  );
};
