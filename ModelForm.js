import _ from 'lodash';
import Vue from 'vue';

class FieldDef {
    constructor() {
    }

    build(def) {
        this.numRendered = 1;
        this.required = false;
        this.title = def.title;
        this.type = def.type;
        this.rules = [];

        let modelValue = def.modelValue || this.getDefaultModelValue();
        this.setModelValue(modelValue);
    }

    setModelValue(val) {
        Vue.set(this, 'modelValue', val);
    }
}

class IntegerFieldDef extends FieldDef {
    constructor() {
        super()
    }

    getDefaultModelValue() {
      return 0;
    }

    build(def) {
        super.build(def);
        this.fieldName = 'v-slider';

        if(this.type == 'number') {
            this.step = 0.1;
        } else {
            this.step = 1;
        }

        if(def.minimum) {
            this.min = def.minimum;
        }
        if(def.maximum) {
            this.max = def.maximum;
        }

        if(this.required) {
            this.rules.push(
                v => !!v || `${this.fieldName} is required`
            );
        }
        if(this.min) {
            this.rules.push(
                v => {
                    if(v != null) {
                        return this.min <= v || `Value must be greater than or equal to ${this.min}`;
                        // TODO: Error messages must be configurable
                    }
                    else return true;
                }
            );
        }
        if(this.max) {
            this.rules.push(
                v => {
                    if(v != null) {
                        return v <= this.max || `Value must be less than or equal to ${this.max}`;
                    }
                    else return true;
                }
            );
        }
    }
}

class ForeignKeyDef extends IntegerFieldDef {
    constructor() {
        super()
    }

    getDefaultModelValue() {
      return undefined;
    }

    build(def) {
        super.build(def);
    }
}

class TextFieldDef extends FieldDef {
    constructor() {
        super()
    }

    getDefaultModelValue() {
      return '';
    }

    build(def) {
        super.build(def);
        this.fieldName = 'v-text-field';
        this.maxLength = def.maxLength;

        if(this.required) {
            this.rules.push(
                v => !!v || `${this.fieldName} is required`
            );
        }
        if(this.maxLength) {
            this.rules.push(
                v => {
                    if(v != null) {
                        return v.length <= this.maxLength || `Length must be less than or equal to ${this.max}`;
                    }
                    else return true;
                }
            )
        }
    }
}


class AsyncTextSearchDef extends TextFieldDef {
    constructor() {
        super();
    }

    build(def) {
        super.build(def);
    }
}


class CheckBoxDef extends FieldDef {
    constructor() {
        super();
    }

    getDefaultModelValue() {
        return false;
    }

    build(def) {
        super.build(def)
        this.componentType = 'v-checkbox';
    }
}

class SingleItemSelect extends TextFieldDef {
    constructor() {
        super();
    }

    getDefaultModelValue() {
      return {
          value: null,
          display: null
      };
    }

    build(def) {
        super.build(def);
        this.value_id = "value";
        this.text_id = "display";
        this.items = def.choices;
    }
}

class CheckBoxGroupDef extends FieldDef {
    constructor() {
        super()
    }

    getDefaultModelValue() {
      return null;
    }

    build(def) {
        super.build(def);
        this.fieldName = 'v-checkbox';
        this.choices = def.choices;
        this.type = "checkbox";
    }
}

class ArrayDef extends FieldDef {
    constructor() {
        super()
    }

    getDefaultModelValue() {
      return [];
    }

    build(def) {
        super.build(def);
        if("$$ref" in def.items) {
            if(def.multiTyped === true) {
                this.buildForMultiType(def)
            } else {
                this.buildWithoutMultiType(def)
            }
        } else {
          Vue.set(this, 'optionsType', def.items.type);
          Vue.set(this, 'optionsList', def.items.optionsList);

          /*  enumsMap expected to have the following structure:
              {
                "V1": "Value 1 label",
                "V2": "Value 2 label"
                "V3": "Value 3 label"
              }
          */
        }
    }

    buildForMultiType(def) {
        this.multiTyped = def.multiTyped;
        this.multiTypes = def.multiTypes;
        var self = this;

        this.subFields = {};
        this.multiTypes.forEach(function(multiType, index) {
            self.subFields[multiType.type] = ModelsHolder.schemaToFields(def.items);
        });
        this.subSchema = true;
    }

    buildWithoutMultiType(def) {
        this.subFields = ModelsHolder.schemaToFields(def.items);
        this.subSchema = true;
    }
}

function fieldDefFactory(fieldType) {
    switch(fieldType) {
        case 'integer':
        case 'number':
            return new IntegerFieldDef();
        case 'async-text-search':
            return new AsyncTextSearchDef();
        case 'fkey':
            return new ForeignKeyDef();
        case 'string':
            return new TextFieldDef();
        case 'boolean':
            return new CheckBoxDef();
        case 'choices':
            return new CheckBoxGroupDef();
        case 'array':
            return new ArrayDef();
        case 'singleChoiceSelect':
            return new SingleItemSelect();
    }
}

class ModelsHolder {
    constructor(schema) {
        Vue.set(this, 'fields', ModelsHolder.schemaToFields(schema));
    }

    getFieldDefByID(id) {
        return this.fields.find(function (field) {
            return field.id === id;
        })
    }

    static schemaToFields(schema) {
        let fields = [];

        _.forEach(schema.properties, (def, fieldKey) => {
          let fieldDef = null;
          fieldDef = fieldDefFactory(def.type);
          fieldDef.key = fieldDef.id = fieldKey;

          if(schema.required && schema.required[fieldKey]) {
            fieldDef.required=true;
          }

          if('optionsObject' in def) {
            fieldDef.optionsObject = def.optionsObject;
          }

          fieldDef.build(def);
          fields.push(fieldDef);
        });

        return fields;
    }
}

class OptionsObject {
    constructor(t) {
        /*
        *   t = ("async", "sync")
        */

        this.t = t;
        this.listMethod = null;
        this.options = [];
    }

    setListMethod(listMethod) {
        this.listMethod = listMethod;
    }

    setOptions(options) {
        this.options = options;
    }
}

class MultiTypeDef {
    constructor(type, title, prefills) {
        this.type = type;
        this.title = title;
        this.prefills = prefills;
    }

    static createReactiveInstance(type, title, prefills) {
        let instance = new MultiTypeDef(type, title, prefills);
        return Vue.observable(instance);
    }
}

export {
    FieldDef,
    IntegerFieldDef,
    TextFieldDef,
    CheckBoxGroupDef,
    ForeignKeyDef,
    fieldDefFactory,
    OptionsObject,
    MultiTypeDef,
    ModelsHolder
};
