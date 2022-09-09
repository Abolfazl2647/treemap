import { useMemo, useState } from "react";
import Treepmap from "./treemap";
import jsonData from "./hooks/data.json";

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
  const [tile, setTile] = useState(null);

  const Data = useMemo(() => {
    return convertDataForTreeMap(jsonData);
  }, []);

  const handleChange = (data) => {
    setTile(data);
  };

  return (
    <div className="App">
      <Treepmap data={Data} onChange={handleChange} />
    </div>
  );
}

export default App;
