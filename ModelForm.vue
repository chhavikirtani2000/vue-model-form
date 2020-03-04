<template>
    <v-form
        :ref="formRef"
        v-model="valid"
    >
        <model-field-set
            :fields='fields'
        >
        </model-field-set>
        <v-btn
            v-for="btn in buttonDefs"
            v-bind:key="btn.key"
            :color="btn.color"
            :class="btn.class"
            @click="onClickCtrlBtn(btn)"
            :disabled="btn.validates && !valid"
        >
            {{btn.text}}
            <v-icon
                v-if="btn.icon"
                right dark
            >
                {{btn.icon}}
            </v-icon>
        </v-btn>
    </v-form>
</template>

<script>
import _ from 'lodash';
import {FieldDef, IntegerFieldDef, TextFieldDef, CheckBoxGroupDef, schemaToFields} from './ModelForm';
import ModelFieldSet from '@/components/ModelFieldSet.vue';

export default {
    name: 'modelform',
    props: ['modelsHolder', 'buttonDefs', 'hiddenFields', 'formRef', 'currentData'],
    components: {
        'model-field-set': ModelFieldSet
    },
    data: function() {
        return {
            valid: true
        }
    },
    computed: {
        fields: function() {
            var self = this;
            var fields = [];
            if(this.modelsHolder) {
                fields = this.modelsHolder.fields;
            }
            return fields;
        }
    },
    methods: {
        onClickCtrlBtn: function(btnDef) {
            let data = {
                btnDef: btnDef,
                formData: this.prepFormData(this.fields)
            };
            
            let formValid = true;
            if(btnDef.validates) {
              formValid = this.$refs[this.formRef].validate();
            }
            if(formValid) {
              this.$emit('click-ctrl-btn', data);
            }
            else {
              // TODO:
            }
        },
        validate: function() {
            if(this.$refs.form.validate()) {
                this.snackbar = true;
            }
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
