import { shuffle } from "@/utils";

const COLORS = ["red", "green", "purple"];
const SHAPES = ["diamond", "rect", "S"];
const FILLS = ["empty", "solid", "line"];
const AMOUNTS = [1, 2, 3];
export const CARD_LIST = COLORS.reduce((list, color) => {
  return list.concat(
    SHAPES.reduce((list2, shape) => {
      return list2.concat(
        FILLS.reduce((list3, fill) => {
          return list3.concat(
            AMOUNTS.reduce((list4, n) => {
              return list4.concat({
                color,
                shape,
                fill,
                n,
              });
            }, [])
          );
        }, [])
      );
    }, [])
  );
}, []);

export function initCardList() {
  let initList = [];
  let continueFlag = true;
  while (continueFlag) {
    initList = shuffle(CARD_LIST);
    if (judgeSetExists(initList.slice(0, 12))) {
      continueFlag = false;
    }
  }
  return initList;
}

export function judgeSetExists(
  list: Set.SetCardData[]
): boolean | Set.SetCardData[] {
  const L = list.length;
  for (let i = 0; i < L; i++)
    for (let j = i + 1; j < L; j++)
      for (let k = j + 1; k < L; k++) {
        const judgeList = [list[i], list[j], list[k]];
        if (judgeSet(judgeList)) return judgeList;
      }

  return false;
}

export function judgeSet(list: Set.SetCardData[]): boolean {
  const colorKinds = getKinds(list, "color");
  if (colorKinds !== 1 && colorKinds !== 3) {
    return false;
  }
  const shapeKinds = getKinds(list, "shape");
  if (shapeKinds !== 1 && shapeKinds !== 3) {
    return false;
  }
  const fillKinds = getKinds(list, "fill");
  if (fillKinds !== 1 && fillKinds !== 3) {
    return false;
  }
  const nKinds = getKinds(list, "n");
  if (nKinds !== 1 && nKinds !== 3) {
    return false;
  }
  return true;
}

function getKinds(list: any[], key: string): number {
  if (list.some((item) => !item.color)) return 0;
  return Array.from(new Set(list.map((item) => item[key]))).length;
}
