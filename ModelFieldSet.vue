<template>
    <span>
        <span
            v-for="field in fields"
            v-bind:key="field.key"
        >
            <v-text-field
                v-if="field.type == 'string'"
                :label="field.title"
                :rules="field.rules"
                :counter="field.maxLength"
                :required="field.required"
                v-model="field.modelValue"
                @click="onClickMethod(field)"
            >
            </v-text-field>

            <v-slider
                v-else-if="field.type == 'slider'"
                :label="field.title"
                thumb-label="always"
                :required="field.required"
                v-model="field.modelValue"
                @click="onClickMethod(field)"
            >
            </v-slider>

            <v-text-field
                v-if="field.type == 'integer'"
                :label="field.title"
                :min="field.min"
                :max="field.max"
                :rules="field.rules"
                type="number"
                :step="field.step"
                :required="field.required"
                v-model="field.modelValue"
                @click="onClickMethod(field)"
            >
            </v-text-field>

            <v-text-field
                v-if="field.type == 'number'"
                :label="field.title"
                :min="field.min"
                :max="field.max"
                :rules="field.rules"
                type="number"
                :step="field.step"
                :required="field.required"
                v-model="field.modelValue"
                @click="onClickMethod(field)"
            >
            </v-text-field>

            <async-autocomplete-field
                v-if="field.type == 'fkey' || field.type == 'async-text-search'"
                :fieldDef='field'
                @click="onClickMethod(field)"
            >
            </async-autocomplete-field>

            <keep-alive v-if="field.type == 'boolean'">
                <component
                    :is="field.componentType"
                    :label="field.title"
                    v-model="field.modelValue"
                    @click="onClickMethod(field)"
                >
                </component>
            </keep-alive>

            <v-item-group
                v-if="field.type == 'checkbox'"
            >
                <v-checkbox
                    v-for="choice in field.choices"
                    v-bind:key="choice.value"
                    :label="choice.display"
                    :value="choice.value"
                    v-model="field.modelValue"
                    :required="field.required"
                    @click="onClickMethod(field)"
                >
                </v-checkbox>
            </v-item-group>

            <v-select
              v-if="field.type == 'singleChoiceSelect'"
              :items="field.items"
              :label="field.title"
              :item-value="field.value_id"
              :item-text="field.text_id"
              @click="onClickMethod(field)"
              outlined
              v-model="field.modelValue"
              return-object
            ></v-select>

            <div v-if="field.type == 'array' && field.subSchema == true && field.multiTyped == true">
              <dynamic-list-field
                v-for="multiType in field.multiTypes"
                :key="multiType.type"
                :fieldTitle="multiType.title"
                @click="onClickMethod(field)"
              >
                <model-field-set
                  :fields="transformFieldsForMultiType(field.subFields, multiType)"
                >
                <!--
                  Since fields is calculated from transformFieldsForMultiType,
                  it has a reactive dependence - multiType. transformFieldsForMultiType would
                  be called everytime multiType is changed.

                  It should be determined within transformFieldsForMultiType whether the
                  fields are reset.
                 -->
                </model-field-set>
              </dynamic-list-field>
            </div>

            <dynamic-list-field
              v-if="field.type == 'array' && field.subSchema == true && field.multiTyped == false"
              :fieldTitle="field.title"
              @click="onClickMethod(field)"
            >
              <model-field-set
                :fields="field.subFields"
              >
              </model-field-set>
            </dynamic-list-field>

            <v-card
              v-if="field.type == 'array' && field.subSchema !== true && field.multiTyped == false"
              flat
            >
              <v-card-title>
                {{field.title}}
              </v-card-title>
              <v-card-text>
                <v-checkbox
                  v-for="option in field.optionsList"
                  v-bind:key="option.value"
                  v-model="field.modelValue"
                  :label="option.label"
                  :value="option.value">
                </v-checkbox>
              </v-card-text>
            </v-card>
        </span>
    </span>
</template>

<script>
import DynamicListField from '@/components/DynamicListField.vue';
import AsyncAutocompleteField from '@/components/AsyncAutocompleteField.vue';

export default {
    name: 'model-field-set',
    components: {
        'dynamic-list-field': DynamicListField,
        'async-autocomplete-field': AsyncAutocompleteField
    },
    props: {
        'fields': Array
    },
    methods: {
      onClickMethod(field) {
        if(field.needsSuggestion) {
          let data = {
              focusField: field,
              fields: this.fields
          };
          // TODO: Add way to notify observers of focus event
        }
      },
      transformFieldsForMultiType(subFields, multiType) {
        let preppedFormData = this.prepFormData(this.fields);
        var typedSubFields = subFields[multiType.type];
        for(var prefillKey in multiType.prefills) {
          var fieldIndex = typedSubFields.findIndex(function(subField, index) {
            return ("id" in subField) && (subField.id == prefillKey);
          });

          if(fieldIndex > -1) {
            var prefillValue = multiType.prefills[prefillKey];
            if(prefillValue instanceof Function) {
              typedSubFields[fieldIndex].modelValue = prefillValue(preppedFormData);
            } else {
                typedSubFields[fieldIndex].modelValue = prefillValue;
            }
          } else {
            //TODO:
          }
        }

        return typedSubFields;
      },
      prepFormData(formData) {
        return _.reduce(
          formData,
          (accumulator, value, index, collection) => {
            accumulator[value.id] = value.modelValue;

            return accumulator;
          },
          {}
        );
      }
    }
}
</script>

<style>

</style>
