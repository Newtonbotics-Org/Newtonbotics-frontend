import { Info } from "lucide-react";
import styles from "./inventory.module.css";

export default function InventoryNotice({ children }) {
  return <div className={styles.notice}><Info size={19} aria-hidden="true" /><div>{children}</div></div>;
}
