let metaPageId: string | null = null;

export const getMetaPageId = () => metaPageId;
export const setMetaPageId = (id: string | null) => {
  metaPageId = id;
};
