import { useState, useEffect } from "react";

const convertDataForTreeMap = (object) => {
  //   console.log("object in", object);
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

  //   console.log("object out", outObj);
  return outObj;
};

export default function useMarketMap() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("https://dev.zh1.app/api/market/map?type=1")
      .then((res) => res.json())
      .then((data) => {
        setData(convertDataForTreeMap(data));
        setLoading(false);
      });
  }, []);

  return [data, loading];
}
