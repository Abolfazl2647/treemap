import Treemap from "./treemap";
import jsonData from "./hooks/data.json";
import { useState } from "react";

export const convertDataForTreeMap = (object) => {
  const array = object.sectors;

  const newArray = array
    .map((item) => {
      return {
        code: item.code,
        name: item.name,
        value: item.instruments.reduce((prev, currnet) => {
          return prev + currnet.tradeSummary.totalValue;
        }, 0),
        children: item.instruments
          .map((elem) => {
            return {
              name: elem.name,
              detailName: elem.detailName,
              category: item.code,
              ...elem.tradeSummary,
            };
          })
          .sort((a, b) => b.totalValue - a.totalValue),
      };
    })
    .sort((a, b) => b.value - a.value);

  const outObj = {
    category: object.title,
    type: object.type,
    children: newArray,
  };

  return outObj;
};

function App() {
  const [tile, setData] = useState(null);

  const handleHover = (info) => setData(info);

  console.log("tile", tile);

  return (
    <Treemap data={convertDataForTreeMap(jsonData)} onHover={handleHover} />
  );
}

export default App;
