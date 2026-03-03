import styles from "@/app/(beforeLogin)/_component/main.module.css";
import Image from "next/image";
import zLogo from "../../../../public/zlogo.png";
import Link from "next/link";

export default function Main() {
  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <Image src={zLogo} alt="logo" />
      </div>
      <div className={styles.right}>
        <h1>See what is happening now</h1>
        <h2>Join the gateway-powered network.</h2>
        <Link href="/auth/signup" className={styles.signup}>Create account</Link>
        <h3>Already have access?</h3>
        <Link href="/auth/login" className={styles.login}>Sign in</Link>
      </div>
    </div>
  );
}
