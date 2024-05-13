import { LovelaceCardConfig } from "../../../data/lovelace/config/card";
import { LovelaceSectionRawConfig } from "../../../data/lovelace/config/section";
import { LovelaceConfig } from "../../../data/lovelace/config/types";
import {
  LovelaceViewConfig,
  isStrategyView,
} from "../../../data/lovelace/config/view";
import type { HomeAssistant } from "../../../types";
import {
  LovelaceCardPath,
  LovelaceContainerPath,
  findLovelaceCards,
  findLovelaceContainer,
  getLovelaceContainerPath,
  parseLovelaceCardPath,
  parseLovelaceContainerPath,
  updateLovelaceCards,
  updateLovelaceContainer,
} from "./lovelace-path";

export const addCard = (
  config: LovelaceConfig,
  path: LovelaceContainerPath,
  cardConfig: LovelaceCardConfig
): LovelaceConfig => {
  const cards = findLovelaceCards(config, path);
  const newCards = cards ? [...cards, cardConfig] : [cardConfig];
  const newConfig = updateLovelaceCards(config, path, newCards);
  return newConfig;
};

export const addCards = (
  config: LovelaceConfig,
  path: LovelaceContainerPath,
  cardConfigs: LovelaceCardConfig[]
): LovelaceConfig => {
  const cards = findLovelaceCards(config, path);
  const newCards = cards ? [...cards, ...cardConfigs] : [...cardConfigs];
  const newConfig = updateLovelaceCards(config, path, newCards);
  return newConfig;
};

export const replaceCard = (
  config: LovelaceConfig,
  path: LovelaceCardPath,
  cardConfig: LovelaceCardConfig
): LovelaceConfig => {
  const { cardIndex } = parseLovelaceCardPath(path);
  const containerPath = getLovelaceContainerPath(path);

  const cards = findLovelaceCards(config, containerPath);

  const newCards = (cards ?? []).map((origConf, ind) =>
    ind === cardIndex ? cardConfig : origConf
  );

  const newConfig = updateLovelaceCards(config, containerPath, newCards);
  return newConfig;
};

export const deleteCard = (
  config: LovelaceConfig,
  path: LovelaceCardPath
): LovelaceConfig => {
  const { cardIndex } = parseLovelaceCardPath(path);
  const containerPath = getLovelaceContainerPath(path);

  const cards = findLovelaceCards(config, containerPath);

  const newCards = (cards ?? []).filter((_origConf, ind) => ind !== cardIndex);

  const newConfig = updateLovelaceCards(config, containerPath, newCards);
  return newConfig;
};

export const insertCard = (
  config: LovelaceConfig,
  path: LovelaceCardPath,
  cardConfig: LovelaceCardConfig
) => {
  const { cardIndex } = parseLovelaceCardPath(path);
  const containerPath = getLovelaceContainerPath(path);

  const cards = findLovelaceCards(config, containerPath);

  const newCards = cards
    ? [...cards.slice(0, cardIndex), cardConfig, ...cards.slice(cardIndex)]
    : [cardConfig];

  const newConfig = updateLovelaceCards(config, containerPath, newCards);
  return newConfig;
};

export const moveCardToIndex = (
  config: LovelaceConfig,
  path: LovelaceCardPath,
  index: number
): LovelaceConfig => {
  const { cardIndex } = parseLovelaceCardPath(path);
  const containerPath = getLovelaceContainerPath(path);

  const cards = findLovelaceCards(config, containerPath);

  const newCards = cards ? [...cards] : [];

  const oldIndex = cardIndex;
  const newIndex = Math.max(Math.min(index, newCards.length - 1), 0);

  const card = newCards[oldIndex];
  newCards.splice(oldIndex, 1);
  newCards.splice(newIndex, 0, card);

  const newConfig = updateLovelaceCards(config, containerPath, newCards);
  return newConfig;
};

export const moveCardToContainer = (
  config: LovelaceConfig,
  fromPath: LovelaceCardPath,
  toPath: LovelaceContainerPath
): LovelaceConfig => {
  const {
    cardIndex: fromCardIndex,
    viewIndex: fromViewIndex,
    sectionIndex: fromSectionIndex,
  } = parseLovelaceCardPath(fromPath);
  const { viewIndex: toViewIndex, sectionIndex: toSectionIndex } =
    parseLovelaceContainerPath(toPath);

  if (fromViewIndex === toViewIndex && fromSectionIndex === toSectionIndex) {
    throw new Error("You cannot move a card to the view or section it is in.");
  }

  const fromContainerPath = getLovelaceContainerPath(fromPath);
  const cards = findLovelaceCards(config, fromContainerPath);
  const card = cards![fromCardIndex];

  let newConfig = addCard(config, toPath, card);
  newConfig = deleteCard(newConfig, fromPath);

  return newConfig;
};

export const moveCard = (
  config: LovelaceConfig,
  fromPath: LovelaceCardPath,
  toPath: LovelaceCardPath
): LovelaceConfig => {
  const { cardIndex: fromCardIndex } = parseLovelaceCardPath(fromPath);
  const fromContainerPath = getLovelaceContainerPath(fromPath);
  const cards = findLovelaceCards(config, fromContainerPath);
  const card = cards![fromCardIndex];

  let newConfig = deleteCard(config, fromPath);
  newConfig = insertCard(newConfig, toPath, card);

  return newConfig;
};

export const addView = (
  hass: HomeAssistant,
  config: LovelaceConfig,
  viewConfig: LovelaceViewConfig
): LovelaceConfig => {
  if (viewConfig.path && config.views.some((v) => v.path === viewConfig.path)) {
    throw new Error(
      hass.localize("ui.panel.lovelace.editor.edit_view.error_same_url")
    );
  }
  return {
    ...config,
    views: config.views.concat(viewConfig),
  };
};

export const replaceView = (
  hass: HomeAssistant,
  config: LovelaceConfig,
  viewIndex: number,
  viewConfig: LovelaceViewConfig
): LovelaceConfig => {
  if (
    viewConfig.path &&
    config.views.some(
      (v, idx) => v.path === viewConfig.path && idx !== viewIndex
    )
  ) {
    throw new Error(
      hass.localize("ui.panel.lovelace.editor.edit_view.error_same_url")
    );
  }
  return {
    ...config,
    views: config.views.map((origView, index) =>
      index === viewIndex ? viewConfig : origView
    ),
  };
};

export const swapView = (
  config: LovelaceConfig,
  path1: number,
  path2: number
): LovelaceConfig => {
  const view1 = config.views[path1];
  const view2 = config.views[path2];

  return {
    ...config,
    views: config.views.map((origView, index) =>
      index === path2 ? view1 : index === path1 ? view2 : origView
    ),
  };
};

export const deleteView = (
  config: LovelaceConfig,
  viewIndex: number
): LovelaceConfig => ({
  ...config,
  views: config.views.filter((_origView, index) => index !== viewIndex),
});

export const addSection = (
  config: LovelaceConfig,
  viewIndex: number,
  sectionConfig: LovelaceSectionRawConfig
): LovelaceConfig => {
  const view = findLovelaceContainer(config, [viewIndex]) as LovelaceViewConfig;
  if (isStrategyView(view)) {
    throw new Error("Deleting sections in a strategy is not supported.");
  }
  const sections = view.sections
    ? [...view.sections, sectionConfig]
    : [sectionConfig];

  const newConfig = updateLovelaceContainer(config, [viewIndex], {
    ...view,
    sections,
  });
  return newConfig;
};

export const deleteSection = (
  config: LovelaceConfig,
  viewIndex: number,
  sectionIndex: number
): LovelaceConfig => {
  const view = findLovelaceContainer(config, [viewIndex]) as LovelaceViewConfig;
  if (isStrategyView(view)) {
    throw new Error("Deleting sections in a strategy is not supported.");
  }
  const sections = view.sections?.filter(
    (_origSection, index) => index !== sectionIndex
  );

  const newConfig = updateLovelaceContainer(config, [viewIndex], {
    ...view,
    sections,
  });
  return newConfig;
};

export const insertSection = (
  config: LovelaceConfig,
  viewIndex: number,
  sectionIndex: number,
  sectionConfig: LovelaceSectionRawConfig
): LovelaceConfig => {
  const view = findLovelaceContainer(config, [viewIndex]) as LovelaceViewConfig;
  if (isStrategyView(view)) {
    throw new Error("Inserting sections in a strategy is not supported.");
  }
  const sections = view.sections
    ? [
        ...view.sections.slice(0, sectionIndex),
        sectionConfig,
        ...view.sections.slice(sectionIndex),
      ]
    : [sectionConfig];

  const newConfig = updateLovelaceContainer(config, [viewIndex], {
    ...view,
    sections,
  });
  return newConfig;
};

export const moveSection = (
  config: LovelaceConfig,
  fromPath: [number, number],
  toPath: [number, number]
): LovelaceConfig => {
  const section = findLovelaceContainer(
    config,
    fromPath
  ) as LovelaceSectionRawConfig;

  let newConfig = deleteSection(config, fromPath[0], fromPath[1]);
  newConfig = insertSection(newConfig, toPath[0], toPath[1], section);

  return newConfig;
};
