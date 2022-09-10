import { useEffect, useMemo, useState } from "react";
import Treepmap from "./treemap";
import jsonData from "./hooks/data.json";
import jsonData1 from "./hooks/data1.json";

export const convertDataForTreeMap = (object, key) => {
  const array = object.sectors;

  const newArray = array
    .map((item) => {
      return {
        code: item.code,
        name: item.name,
        value: item.instruments.reduce((prev, currnet) => {
          return prev + currnet.tradeSummary[key];
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
          .sort((a, b) => b[key] - a[key]),
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
  const [treemapData, setTreemapData] = useState(jsonData);
  const [sortValue, setSortValue] = useState("totalValue");
  const [tile, setTile] = useState(null);

  const Data = useMemo(() => {
    return convertDataForTreeMap(treemapData, sortValue);
  }, [sortValue, treemapData]);

  const handleChange = (data) => {
    setTile(data);
  };

  const handleClick = () => {
    setSortValue("priceChange");
  };

  useEffect(() => {
    setTimeout(() => {
      setTreemapData(jsonData1);
    }, 5000);
  }, []);

  return (
    <div className="App">
      <Treepmap
        data={Data}
        onChange={handleChange}
        onClick={handleClick}
        sortValue={sortValue}
      />
    </div>
  );
}

export default App;
