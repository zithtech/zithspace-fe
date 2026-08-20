export let serverTimeOffset = 0;

export const setServerTimeOffset = (offset: number) => {
  serverTimeOffset = offset;
};

export const getSyncedTime = () => {
  return new Date(Date.now() + serverTimeOffset);
};
