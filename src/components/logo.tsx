import Image from "next/image";
import logo from "@/assets/images/logo.png";

export default function Logo() {
  return <Image src={logo} alt="Uplevl" className="object-cover w-[150px] h-[47px]" width={150} height={47} priority />;
}
