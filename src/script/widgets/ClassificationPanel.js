/**
 * Copyright (c) 2008-2011 The Open Planning Project
 *
 * Published under the GPL license.
 * See https://github.com/opengeo/gxp/raw/master/license.txt for the full text
 * of the license.
 */

Ext.namespace("gxp");

gxp.ClassificationPanel = Ext.extend(Ext.Panel, {

    hidden: false,

    rulePanel: null,

    classifyText: "Classify",
    rampBlueText: "Blue",
    rampRedText: "Red",
    rampJetText: "Blue-Red",
    rampGrayText: "Gray",
    rampRandomText: "Random",
    rampCustomText: "Custom",
    selectColorText: "Select colors",
    colorStartText: "Start Color",
    colorEndText: "End Color",
    methodUniqueText: "Unique Values",
    methodQuantileText: "Quantile",
    methodEqualText: "Equal Intervals",
    attributeText: "Attribute",
    selectAttributeText: "Select attribute",
    startColor: "#000000",
    endColor: "#FFFFFF",


    initComponent: function() {
        var colorFieldPlugins;
        if (this.rulePanel.colorManager) {
            colorFieldPlugins = [new this.rulePanel.colorManager];
        }

        var colorPanel =    new Ext.Panel({
            hidden: true,
            layout: 'form',
            bodyStyle: {padding: "10px"},
            border: false,
            labelWidth: 70,
            defaults: {
                labelWidth: 70
            },
            items: [
                {
                    xtype: "gxp_colorfield",
                    id: "choropleth_color_start",
                    name: "color_start",
                    fieldLabel: this.colorStartText,
                    emptyText: OpenLayers.Renderer.defaultSymbolizer.strokeColor,
                    value: this.startColor,
                    defaultBackground: this.startColor,
                    plugins: colorFieldPlugins,
                    listeners: {
                        valid: function(field) {
                            this.rulePanel.rule[field.name] = field.getValue();
                            this.rulePanel.fireEvent("change", this.rulePanel, this.rulePanel.rule);
                        },
                        scope: this
                    }
                },
                {   xtype: "gxp_colorfield",
                    id: "choropleth_color_end",
                    name: "color_end",
                    fieldLabel: this.colorEndText,
                    emptyText: OpenLayers.Renderer.defaultSymbolizer.strokeColor,
                    value: this.endColor,
                    defaultBackground: this.endColor,
                    plugins: colorFieldPlugins,
                    listeners: {
                        valid: function(field) {
                            this.rulePanel.rule[field.name] = field.getValue();
                            this.rulePanel.fireEvent("change", this.rulePanel, this.rulePanel.rule);
                        },
                        scope: this
                    },
                    scope: this
                }

            ]
        });



        var classNumSelector = new Ext.ux.form.SpinnerField({
            fieldLabel: 'Classes',
            id: "choropleth_classes",
            minValue: 2,
            name: 'intervals',
            defaultValue: 5,
            width: 110,
            listeners: {
                'change':function(spinner, value){
                    this.rulePanel.rule['intervals'] = value;
                    this.rulePanel.fireEvent("change", this.rulePanel, this.rulePanel.rule);
                },
                scope: this
            }
        });

        this.rulePanel.rule["intervals"] = classNumSelector.defaultValue;

        var colorDropdown = new Ext.form.ComboBox({
            id: 'choropleth_colorramp',
            name: 'ramp',
            fieldLabel: 'Color Ramp',
            store:  new Ext.data.ArrayStore({
                id: 0,
                fields: [
                    'colorramp',
                    'label'
                ],
                data: [
                    ['Blue',this.rampBlueText],
                    ['Red', this.rampRedText],
                    ['Jet', this.rampJetText],
                    ['Gray', this.rampGrayText],
                    ['Random', this.rampRandomText],
                    ['Custom', this.rampCustomText]]
            }),
            mode: 'local',
            width: 110,
            displayField: "label",
            valueField: "colorramp",
            editable: false,
            emptyText: this.selectColorText,
            triggerAction: 'all',
            disabled: false,
            listeners: {
                'select': function(cmb, data, idx) {

                    //If Custom: display start, end, middle color picker;
                    colorPanel.setVisible(cmb.value == "Custom");
                    this.rulePanel.rule[cmb.name] = cmb.value;
                    this.rulePanel.fireEvent("change", this.rulePanel, this.rulePanel.rule);

                },
                scope: this
            }
        });


        var methodDropdown = new Ext.form.ComboBox({
            id: 'choropleth_method',
            name: 'method',
            fieldLabel: 'Method',
            store:  new Ext.data.ArrayStore({
                id: 0,
                mode: 'local',
                autoDestroy: true,
                storeId: 'method_array_store',
                fields: [
                    'value', 'label'
                ],
                data: [
                    ['uniqueInterval', this.methodUniqueText],
                    ['quantile', this.methodQuantileText],
                    ['equalInterval', this.methodEqualText]
                ]
            }),
            displayField: 'label',
            valueField: 'value',
            mode: 'local',
            width: 110,
            editable: false,
            emptyText: 'Select method',
            triggerAction: 'all',
            disabled: false,
            listeners: {
                'select': function(cmb, data, idx) {

                    //If uniqueInterval: disable # classes
                    classNumSelector.setDisabled(cmb.value == "uniqueInterval");
                    this.rulePanel.rule[cmb.name] = cmb.value;
                    this.rulePanel.fireEvent("change", this.rulePanel, this.rulePanel.rule);

                },
                scope: this
            }
        });

        var attributeDropdown =  new Ext.form.ComboBox({
            id: 'choropleth_attribute',
            name: 'attribute',
            fieldLabel: this.attributeText,
            store: this.rulePanel.attributes,
            displayField: 'name',
            valueField: 'name',
            triggerAction: 'all',
            mode: 'local',
            width: 110,
            editable: false,
            emptyText: this.selectAttributeText,
            disabled: false,
            listeners: {
                'select': function(cmb, data, idx) {
                    this.rulePanel.rule[cmb.name] = cmb.value;


                    methodDropdown.clearValue();
                    var methodStore =   methodDropdown.getStore();
                    for (var i = 0; i < methodStore.data.length; i++) {
                        methodStore.getAt(i).disabled = (cmb.getStore().getAt(idx).get("type") == "xsd:string" ? methodStore.getAt(i).get("value") != "uniqueInterval": false);
                    }

                    methodStore.loadData(cmb.getStore().getAt(idx).get("type") == "xsd:string" ?
                        [['uniqueInterval',this.methodUniqueText]]
                        :[['uniqueInterval',this.methodUniqueText],
                        ['quantile', this.methodQuantileText],
                        ['equalInterval',this.methodEqualText]]
                    );

                    this.rulePanel.fireEvent("change", this.rulePanel, this.rulePanel.rule);
                },
                scope: this
            }
        });

        this.items = [
            {
                xtype:"fieldset",
                title:this.classifyText,
                labelWidth:85,
                style:"margin-bottom: 0;",
                items: [
                    //Dropdown: attributes
                    attributeDropdown,
                    //Dropdown: classification mode
                    methodDropdown,
                    //Classes, use http://dev.sencha.com/deploy/ext-3.4.0/examples/spinner/spinner.html
                    classNumSelector,
                    //Dropdown: color ramp
                    colorDropdown,
                    //Text field /  Ext.menu.ColorMenu: start color
                    colorPanel
                ]
            }
        ]

        gxp.ClassificationPanel.superclass.initComponent.call(this);
    }

});

/** api: xtype = gxp_linesymbolizer */
Ext.reg('gxp_classificationpanel', gxp.ClassificationPanel);