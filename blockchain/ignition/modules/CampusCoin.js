import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CampusCoinModule", (m) => {
  const campusCoin = m.contract("CampusCoin");

  return { campusCoin };
});
