import Link from "next/link";
import { NextPage } from "next";

const NotFound: NextPage = () => {
  return (
    <div>
      <div>This page does not exist. Try another route.</div>
      <Link href="/home">Go to home</Link>
    </div>
  )
}

export default NotFound;
