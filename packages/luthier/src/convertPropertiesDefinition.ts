import { resolveAttributeName } from "./resolveAttributeName";
import type {
  PropertiesDefinition,
  PropertyDefinition,
  PropertyInfo,
  ReactiveProperties,
  ReactiveProperty,
} from "./types";

export function convertPropertiesDefinition(
  propertiesDefinition: PropertiesDefinition<any>,
): ReactiveProperties {
  return Object.entries(propertiesDefinition).map(
    ([propertyName, configPartial]: [
      string,
      PropertyDefinition<PropertyInfo<any, any>>,
    ]): ReactiveProperty => {
      return {
        ...configPartial,
        propertyName,
        attributeName: resolveAttributeName(configPartial.attributeName),
      };
    },
  );
}
