var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
//To make typing safe
var Isteven = /** @class */ (function () {
    function Isteven() {
        //  element: any;
        this.prevTabIndex = 0;
        this.helperItems = [];
        this.helperItemsLength = 0;
        this.checkBoxLayer = '';
        this.scrolled = false;
        this.selectedItems = [];
        this.formElements = [];
        this.vMinSearchLength = 0;
        this.clickedItem = null;
        this.tickProperty = null;
        this.more = false;
        this.backUp = [];
        this.varButtonLabel = '';
        this.spacingProperty = '';
        this.indexProperty = '';
        this.orientationH = false;
        this.orientationV = true;
        this.filteredModel = [];
        this.inputLabel = { labelFilter: '' };
        this.tabIndex = 0;
        this.lang = {};
        this.helperStatus = {
            all: true,
            none: true,
            reset: true,
            filter: true
        };
    }
    return Isteven;
}());
var IstevenController = /** @class */ (function (_super) {
    __extends(IstevenController, _super);
    function IstevenController($scope, $sce, $timeout, $templateCache, element, attrs) {
        var _this = _super.call(this) || this;
        _this.$scope = $scope;
        _this.$sce = $sce;
        _this.$timeout = $timeout;
        _this.$templateCache = $templateCache;
        _this.element = element;
        _this.attrs = attrs;
        // v3.0.0
        // clear button clicked
        _this.clearClicked = function (e) {
            _this.inputLabel.labelFilter = '';
            _this.updateFilter();
            _this.select('clear', e);
        };
        // UI operations to show/hide checkboxes based on click event..
        _this.toggleCheckboxes = function (e) {
            var _this = this;
            // We grab the button
            var clickedEl = this.element.children()[0];
            // Just to make sure.. had a bug where key events were recorded twice
            angular.element(document).off('click', this.externalClickListener.bind(this));
            angular.element(document).off('keydown', this.keyboardListener.bind(this));
            // The idea below was taken from another multi-select directive - https://github.com/amitava82/angular-multiselect 
            // His version is awesome if you need a more simple multi-select approach.                                
            // close
            if (angular.element(this.checkBoxLayer).hasClass('show')) {
                angular.element(this.checkBoxLayer).removeClass('show');
                angular.element(clickedEl).removeClass('buttonClicked');
                angular.element(document).off('click', this.externalClickListener.bind(this));
                angular.element(document).off('keydown', this.keyboardListener.bind(this));
                // clear the focused this.element;
                this.removeFocusStyle(this.tabIndex);
                if (typeof this.formElements[this.tabIndex] !== 'undefined') {
                    this.formElements[this.tabIndex].blur();
                }
                // close callback
                this.$timeout(function () {
                    _this.onClose();
                }, 0);
                // set focus on button again
                this.element.children().children()[0].focus();
            }
            else {
                // clear filter
                this.inputLabel.labelFilter = '';
                this.updateFilter();
                this.helperItems = [];
                this.helperItemsLength = 0;
                angular.element(this.checkBoxLayer).addClass('show');
                angular.element(clickedEl).addClass('buttonClicked');
                // Attach change event listener on the input filter. 
                // We need this because ng-change is apparently not an event listener.                    
                angular.element(document).on('click', this.externalClickListener.bind(this));
                angular.element(document).on('keydown', this.keyboardListener.bind(this));
                // to get the initial tab index, depending on how many helper elements we have. 
                // priority is to always focus it on the input filter                                                                
                this.getFormElements();
                this.tabIndex = 0;
                var helperContainer = angular.element(this.element[0].querySelector('.helperContainer'))[0];
                if (typeof helperContainer !== 'undefined') {
                    for (var i = 0; i < helperContainer.getElementsByTagName('BUTTON').length; i++) {
                        this.helperItems[i] = helperContainer.getElementsByTagName('BUTTON')[i];
                    }
                    this.helperItemsLength = this.helperItems.length + helperContainer.getElementsByTagName('INPUT').length;
                }
                // focus on the filter this.element on open. 
                if (this.element[0].querySelector('.inputFilter')) {
                    this.element[0].querySelector('.inputFilter').focus();
                    this.tabIndex = this.tabIndex + this.helperItemsLength - 2;
                    // blur button in vain
                    angular.element(this.element).children()[0].blur();
                }
                else {
                    if (!this.isDisabled) {
                        this.tabIndex = this.tabIndex + this.helperItemsLength;
                        if (this.inputModel.length > 0) {
                            this.formElements[this.tabIndex].focus();
                            this.setFocusStyle(this.tabIndex);
                            // blur button in vain
                            angular.element(this.element).children()[0].blur();
                        }
                    }
                }
                // open callback
                this.onOpen();
            }
        };
        _this.init();
        _this.propInitialization();
        IstevenController.attrs = attrs;
        return _this;
    }
    IstevenController.prototype.init = function () {
    };
    // A little hack so that AngularJS ng-repeat can loop using start and end index like a normal loop
    // http://stackoverflow.com/questions/16824853/way-to-ng-repeat-defined-number-of-times-instead-of-repeating-over-array
    IstevenController.prototype.numberToArray = function (num) {
        return new Array(num);
    };
    // Call this function when user type on the filter field
    IstevenController.prototype.searchChanged = function () {
        if (this.inputLabel.labelFilter.length < this.vMinSearchLength && this.inputLabel.labelFilter.length > 0) {
            return false;
        }
        this.updateFilter();
    };
    IstevenController.prototype.updateFilter = function () {
        var _this = this;
        // we check by looping from end of input-model
        this.filteredModel = [];
        var i = 0;
        if (typeof this.inputModel === 'undefined') {
            return false;
        }
        for (i = this.inputModel.length - 1; i >= 0; i--) {
            // if it's group end, we push it to filteredModel[];
            if (typeof this.inputModel[i][this.attrs.groupProperty] !== 'undefined' && this.inputModel[i][this.attrs.groupProperty] === false) {
                this.filteredModel.push(this.inputModel[i]);
            }
            // if it's data 
            var gotData = false;
            if (typeof this.inputModel[i][this.attrs.groupProperty] === 'undefined') {
                // If we set the search-key attribute, we use this loop. 
                if (typeof this.attrs.searchProperty !== 'undefined' && this.attrs.searchProperty !== '') {
                    for (var key in this.inputModel[i]) {
                        if (typeof this.inputModel[i][key] !== 'boolean'
                            && String(this.inputModel[i][key]).toUpperCase().indexOf(this.inputLabel.labelFilter.toUpperCase()) >= 0
                            && this.attrs.searchProperty.indexOf(key) > -1) {
                            gotData = true;
                            break;
                        }
                    }
                }
                else {
                    for (var key in this.inputModel[i]) {
                        if (typeof this.inputModel[i][key] !== 'boolean'
                            && String(this.inputModel[i][key]).toUpperCase().indexOf(this.inputLabel.labelFilter.toUpperCase()) >= 0) {
                            gotData = true;
                            break;
                        }
                    }
                }
                if (gotData === true) {
                    // push
                    this.filteredModel.push(this.inputModel[i]);
                }
            }
            // if it's group start
            if (typeof this.inputModel[i][this.attrs.groupProperty] !== 'undefined' && this.inputModel[i][this.attrs.groupProperty] === true) {
                if (typeof this.filteredModel[this.filteredModel.length - 1][this.attrs.groupProperty] !== 'undefined'
                    && this.filteredModel[this.filteredModel.length - 1][this.attrs.groupProperty] === false) {
                    this.filteredModel.pop();
                }
                else {
                    this.filteredModel.push(this.inputModel[i]);
                }
            }
        }
        this.filteredModel.reverse();
        this.$timeout(function () {
            _this.getFormElements();
            // Callback: on filter change                      
            if (_this.inputLabel.labelFilter.length > _this.vMinSearchLength) {
                var filterObj = [];
                _this.filteredModel.forEach(function (value, key) {
                    if (typeof value !== 'undefined') {
                        if (typeof value[_this.attrs.groupProperty] === 'undefined') {
                            var tempObj = angular.copy(value);
                            var index = filterObj.push(tempObj);
                            delete filterObj[index - 1][_this.indexProperty];
                            delete filterObj[index - 1][_this.spacingProperty];
                        }
                    }
                });
                _this.onSearchChange({
                    data: {
                        keyword: _this.inputLabel.labelFilter,
                        result: filterObj
                    }
                });
            }
        }, 0);
    };
    ;
    // List all the input elements. We need this for our keyboard navigation.
    // This function will be called everytime the filter is updated. 
    // Depending on the size of filtered mode, might not good for performance, but oh well..
    IstevenController.prototype.getFormElements = function () {
        this.formElements = [];
        var selectButtons = [], inputField = [], checkboxes = [], clearButton = [];
        // If available, then get select all, select none, and reset buttons
        if (this.helperStatus.all || this.helperStatus.none || this.helperStatus.reset) {
            selectButtons = this.element.children().children().next().children().children()[0].getElementsByTagName('button');
            // If available, then get the search box and the clear button
            if (this.helperStatus.filter) {
                // Get helper - search and clear button. 
                inputField = this.element.children().children().next().children().children().next()[0].getElementsByTagName('input');
                clearButton = this.element.children().children().next().children().children().next()[0].getElementsByTagName('button');
            }
        }
        else {
            if (this.helperStatus.filter) {
                // Get helper - search and clear button. 
                inputField = this.element.children().children().next().children().children()[0].getElementsByTagName('input');
                clearButton = this.element.children().children().next().children().children()[0].getElementsByTagName('button');
            }
        }
        // Get checkboxes
        if (!this.helperStatus.all && !this.helperStatus.none && !this.helperStatus.reset && !this.helperStatus.filter) {
            checkboxes = this.element.children().children().next()[0].getElementsByTagName('input');
        }
        else {
            checkboxes = this.element.children().children().next().children().next()[0].getElementsByTagName('input');
        }
        // Push them into global array this.formElements[] 
        this.formElements.concat(selectButtons, inputField, clearButton, checkboxes);
        // for ( var i = 0; i < selectButtons.length ; i++ )   { this.formElements.push( selectButtons[ i ] );  }
        // for ( var i = 0; i < inputField.length ; i++ )      { this.formElements.push( inputField[ i ] );     }
        // for ( var i = 0; i < clearButton.length ; i++ )     { this.formElements.push( clearButton[ i ] );    }
        // for ( var i = 0; i < checkboxes.length ; i++ )      { this.formElements.push( checkboxes[ i ] );     }                                
    };
    // check if an item has this.attrs.groupProperty (be it true or false)
    IstevenController.prototype.isGroupMarker = function (item, type) {
        if (typeof item[this.attrs.groupProperty] !== 'undefined' && item[this.attrs.groupProperty] === type)
            return true;
        return false;
    };
    IstevenController.prototype.removeGroupEndMarker = function (item) {
        if (typeof item[IstevenController.attrs.groupProperty] !== 'undefined' && item[IstevenController.attrs.groupProperty] === false)
            return false;
        return true;
    };
    // call this function when an item is clicked
    IstevenController.prototype.syncItems = function (item, e, ng_repeat_index) {
        var _this = this;
        e.preventDefault();
        e.stopPropagation();
        // if the directive is globaly disabled, do nothing
        if (typeof this.attrs.disableProperty !== 'undefined' && item[this.attrs.disableProperty] === true) {
            return false;
        }
        // if item is disabled, do nothing
        if (typeof this.attrs.isDisabled !== 'undefined' && this.isDisabled === true) {
            return false;
        }
        // if end group marker is clicked, do nothing
        if (typeof item[this.attrs.groupProperty] !== 'undefined' && item[this.attrs.groupProperty] === false) {
            return false;
        }
        var index = this.filteredModel.indexOf(item);
        // if the start of group marker is clicked ( only for multiple selection! )
        // how it works:
        // - if, in a group, there are items which are not selected, then they all will be selected
        // - if, in a group, all items are selected, then they all will be de-selected                
        if (typeof item[this.attrs.groupProperty] !== 'undefined' && item[this.attrs.groupProperty] === true) {
            // this is only for multiple selection, so if selection mode is single, do nothing
            if (typeof this.attrs.selectionMode !== 'undefined' && this.attrs.selectionMode.toUpperCase() === 'SINGLE') {
                return false;
            }
            var i, j, k;
            var startIndex = 0;
            var endIndex = this.filteredModel.length - 1;
            var tempArr = [];
            // nest level is to mark the depth of the group.
            // when you get into a group (start group marker), nestLevel++
            // when you exit a group (end group marker), nextLevel--
            var nestLevel = 0;
            // we loop throughout the filtered model (not whole model)
            for (i = index; i < this.filteredModel.length; i++) {
                // this break will be executed when we're done processing each group
                if (nestLevel === 0 && i > index) {
                    break;
                }
                if (typeof this.filteredModel[i][this.attrs.groupProperty] !== 'undefined' && this.filteredModel[i][this.attrs.groupProperty] === true) {
                    // To cater multi level grouping
                    if (tempArr.length === 0) {
                        startIndex = i + 1;
                    }
                    nestLevel = nestLevel + 1;
                }
                else if (typeof this.filteredModel[i][this.attrs.groupProperty] !== 'undefined' && this.filteredModel[i][this.attrs.groupProperty] === false) {
                    nestLevel = nestLevel - 1;
                    // cek if all are ticked or not                            
                    if (tempArr.length > 0 && nestLevel === 0) {
                        var allTicked = true;
                        endIndex = i;
                        for (j = 0; j < tempArr.length; j++) {
                            if (typeof tempArr[j][this.tickProperty] !== 'undefined' && tempArr[j][this.tickProperty] === false) {
                                allTicked = false;
                                break;
                            }
                        }
                        if (allTicked === true) {
                            for (j = startIndex; j <= endIndex; j++) {
                                if (typeof this.filteredModel[j][this.attrs.groupProperty] === 'undefined') {
                                    if (typeof this.attrs.disableProperty === 'undefined') {
                                        this.filteredModel[j][this.tickProperty] = false;
                                        // we refresh input model as well
                                        inputModelIndex = this.filteredModel[j][this.indexProperty];
                                        this.inputModel[inputModelIndex][this.tickProperty] = false;
                                    }
                                    else if (this.filteredModel[j][this.attrs.disableProperty] !== true) {
                                        this.filteredModel[j][this.tickProperty] = false;
                                        // we refresh input model as well
                                        inputModelIndex = this.filteredModel[j][this.indexProperty];
                                        this.inputModel[inputModelIndex][this.tickProperty] = false;
                                    }
                                }
                            }
                        }
                        else {
                            for (j = startIndex; j <= endIndex; j++) {
                                if (typeof this.filteredModel[j][this.attrs.groupProperty] === 'undefined') {
                                    if (typeof this.attrs.disableProperty === 'undefined') {
                                        this.filteredModel[j][this.tickProperty] = true;
                                        // we refresh input model as well
                                        inputModelIndex = this.filteredModel[j][this.indexProperty];
                                        this.inputModel[inputModelIndex][this.tickProperty] = true;
                                    }
                                    else if (this.filteredModel[j][this.attrs.disableProperty] !== true) {
                                        this.filteredModel[j][this.tickProperty] = true;
                                        // we refresh input model as well
                                        inputModelIndex = this.filteredModel[j][this.indexProperty];
                                        this.inputModel[inputModelIndex][this.tickProperty] = true;
                                    }
                                }
                            }
                        }
                    }
                }
                else {
                    tempArr.push(this.filteredModel[i]);
                }
            }
        }
        else {
            // If it's single selection mode
            if (typeof this.attrs.selectionMode !== 'undefined' && this.attrs.selectionMode.toUpperCase() === 'SINGLE') {
                // first, set everything to false
                for (i = 0; i < this.filteredModel.length; i++) {
                    this.filteredModel[i][this.tickProperty] = false;
                }
                for (i = 0; i < this.inputModel.length; i++) {
                    this.inputModel[i][this.tickProperty] = false;
                }
                // then set the clicked item to true
                this.filteredModel[index][this.tickProperty] = true;
            }
            else {
                this.filteredModel[index][this.tickProperty] = !this.filteredModel[index][this.tickProperty];
            }
            // we refresh input model as well
            var inputModelIndex = this.filteredModel[index][this.indexProperty];
            this.inputModel[inputModelIndex][this.tickProperty] = this.filteredModel[index][this.tickProperty];
        }
        // we execute the callback function here
        this.clickedItem = angular.copy(item);
        if (this.clickedItem !== null) {
            this.$timeout(function () {
                delete _this.clickedItem[_this.indexProperty];
                delete _this.clickedItem[_this.spacingProperty];
                _this.onItemClick({ data: _this.clickedItem });
                _this.clickedItem = null;
            }, 0);
        }
        this.refreshOutputModel();
        this.refreshButton();
        // We update the index here
        this.prevTabIndex = this.tabIndex;
        this.tabIndex = ng_repeat_index + this.helperItemsLength;
        // Set focus on the hidden checkbox 
        e.target.focus();
        // set & remove CSS style
        this.removeFocusStyle(this.prevTabIndex);
        this.setFocusStyle(this.tabIndex);
        if (typeof this.attrs.selectionMode !== 'undefined' && this.attrs.selectionMode.toUpperCase() === 'SINGLE') {
            // on single selection mode, we then hide the checkbox layer
            this.toggleCheckboxes(e);
        }
    };
    // update this.outputModel
    IstevenController.prototype.refreshOutputModel = function () {
        var _this = this;
        this.outputModel = [];
        var outputProps = [], tempObj = {};
        // v4.0.0
        if (typeof this.attrs.outputProperties !== 'undefined') {
            outputProps = this.attrs.outputProperties.split(' ');
            this.inputModel.forEach(function (value, key) {
                if (typeof value !== 'undefined'
                    && typeof value[_this.attrs.groupProperty] === 'undefined'
                    && value[_this.tickProperty] === true) {
                    tempObj = {};
                    value.forEach(function (value1, key1) {
                        if (outputProps.indexOf(key1) > -1) {
                            tempObj[key1] = value1;
                        }
                    });
                    var index = _this.outputModel.push(tempObj);
                    delete _this.outputModel[index - 1][_this.indexProperty];
                    delete _this.outputModel[index - 1][_this.spacingProperty];
                }
            });
        }
        else {
            this.inputModel.forEach(function (value, key) {
                if (typeof value !== 'undefined'
                    && typeof value[_this.attrs.groupProperty] === 'undefined'
                    && value[_this.tickProperty] === true) {
                    var temp = angular.copy(value);
                    var index = _this.outputModel.push(temp);
                    delete _this.outputModel[index - 1][_this.indexProperty];
                    delete _this.outputModel[index - 1][_this.spacingProperty];
                }
            });
        }
    };
    // refresh button label
    IstevenController.prototype.refreshButton = function () {
        var _this = this;
        this.varButtonLabel = '';
        var ctr = 0;
        // refresh button label...
        if (this.outputModel.length === 0) {
            // https://github.com/isteven/angular-multi-select/pull/19                    
            this.varButtonLabel = this.lang.nothingSelected;
        }
        else {
            var tempMaxLabels = this.outputModel.length;
            if (typeof this.attrs.maxLabels !== 'undefined' && this.attrs.maxLabels !== '') {
                tempMaxLabels = this.attrs.maxLabels;
            }
            // if max amount of labels displayed..
            if (this.outputModel.length > tempMaxLabels) {
                this.more = true;
            }
            else {
                this.more = false;
            }
            this.inputModel.forEach(function (value, key) {
                if (typeof value !== 'undefined' && value[_this.attrs.tickProperty] === true) {
                    if (ctr < tempMaxLabels) {
                        _this.varButtonLabel += (_this.varButtonLabel.length > 0 ? '</div>, <div class="buttonLabel">' : '<div class="buttonLabel">') + _this.writeLabel(value, 'buttonLabel');
                    }
                    ctr++;
                }
            });
            if (this.more === true) {
                // https://github.com/isteven/angular-multi-select/pull/16
                if (tempMaxLabels > 0) {
                    this.varButtonLabel += ', ... ';
                }
                this.varButtonLabel += '(' + this.outputModel.length + ')';
            }
        }
        this.varButtonLabel = this.$sce.trustAsHtml(this.varButtonLabel + '<span class="caret"></span>');
    };
    // Check if a checkbox is disabled or enabled. It will check the granular control (disableProperty) and global control (isDisabled)
    // Take note that the granular control has higher priority.
    IstevenController.prototype.itemIsDisabled = function (item) {
        if (typeof this.attrs.disableProperty !== 'undefined' && item[this.attrs.disableProperty] === true) {
            return true;
        }
        else {
            if (this.isDisabled === true) {
                return true;
            }
            else {
                return false;
            }
        }
    };
    // A simple function to parse the item label settings. Used on the buttons and checkbox labels.
    IstevenController.prototype.writeLabel = function (item, type) {
        // type is either 'itemLabel' or 'buttonLabel'
        var temp = this.attrs[type].split(' ');
        var label = '';
        temp.forEach(function (value, key) {
            item[value] && (label += '&nbsp;' + value.split('.').reduce(function (prev, current) {
                return prev[current];
            }, item));
        });
        if (type.toUpperCase() === 'BUTTONLABEL') {
            return label;
        }
        return this.$sce.trustAsHtml(label);
    };
    // handle clicks outside the button / multi select layer
    IstevenController.prototype.externalClickListener = function (e) {
        var _this = this;
        var targetsArr = this.element.find(e.target.tagName);
        for (var i = 0; i < targetsArr.length; i++) {
            if (e.target == targetsArr[i]) {
                return;
            }
        }
        angular.element(this.checkBoxLayer.previousSibling).removeClass('buttonClicked');
        angular.element(this.checkBoxLayer).removeClass('show');
        angular.element(document).off('click', this.externalClickListener.bind(this));
        angular.element(document).off('keydown', this.keyboardListener.bind(this));
        // close callback                
        this.$timeout(function () {
            _this.onClose();
        }, 0);
        // set focus on button again
        this.element.children().children()[0].focus();
    };
    // select All / select None / reset buttons
    IstevenController.prototype.select = function (type, e) {
        var _this = this;
        var helperIndex = this.helperItems.indexOf(e.target);
        this.tabIndex = helperIndex;
        switch (type.toUpperCase()) {
            case 'ALL':
                this.filteredModel.forEach(function (value, key) {
                    if (typeof value !== 'undefined' && value[_this.attrs.disableProperty] !== true) {
                        if (typeof value[_this.attrs.groupProperty] === 'undefined') {
                            value[_this.tickProperty] = true;
                        }
                    }
                });
                this.refreshOutputModel();
                this.refreshButton();
                this.onSelectAll();
                break;
            case 'NONE':
                this.filteredModel.forEach(function (value, key) {
                    if (typeof value !== 'undefined' && value[_this.attrs.disableProperty] !== true) {
                        if (typeof value[_this.attrs.groupProperty] === 'undefined') {
                            value[_this.tickProperty] = false;
                        }
                    }
                });
                this.refreshOutputModel();
                this.refreshButton();
                this.onSelectNone();
                break;
            case 'RESET':
                this.filteredModel.forEach(function (value, key) {
                    if (typeof value[_this.attrs.groupProperty] === 'undefined' && typeof value !== 'undefined' && value[_this.attrs.disableProperty] !== true) {
                        var temp = value[_this.indexProperty];
                        value[_this.tickProperty] = _this.backUp[temp][_this.tickProperty];
                    }
                });
                this.refreshOutputModel();
                this.refreshButton();
                this.onReset();
                break;
            case 'CLEAR':
                this.tabIndex = this.tabIndex + 1;
                this.onClear();
                break;
            case 'FILTER':
                this.tabIndex = this.helperItems.length - 1;
                break;
            default:
        }
    };
    // just to create a random variable name                
    IstevenController.prototype.genRandomString = function (length) {
        var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        var temp = '';
        for (var i = 0; i < length; i++) {
            temp += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return temp;
    };
    // count leading spaces
    IstevenController.prototype.prepareGrouping = function () {
        var _this = this;
        var spacing = 0;
        this.filteredModel.forEach(function (value, key) {
            value[_this.spacingProperty] = spacing;
            if (value[_this.attrs.groupProperty] === true) {
                spacing += 2;
            }
            else if (value[_this.attrs.groupProperty] === false) {
                spacing -= 2;
            }
        });
    };
    // prepare original index
    IstevenController.prototype.prepareIndex = function () {
        var _this = this;
        var ctr = 0;
        this.filteredModel.forEach(function (value, key) {
            value[_this.indexProperty] = ctr;
            ctr++;
        });
    };
    // navigate using up and down arrow
    IstevenController.prototype.keyboardListener = function (e) {
        var key = e.keyCode ? e.keyCode : e.which;
        var isNavigationKey = false;
        // ESC key (close)
        if (key === 27) {
            e.preventDefault();
            e.stopPropagation();
            this.toggleCheckboxes(e);
        }
        else if (key === 40 || key === 39 || (!e.shiftKey && key == 9)) {
            isNavigationKey = true;
            this.prevTabIndex = this.tabIndex;
            this.tabIndex++;
            if (this.tabIndex > this.formElements.length - 1) {
                this.tabIndex = 0;
                this.prevTabIndex = this.formElements.length - 1;
            }
            while (this.formElements[this.tabIndex].disabled === true) {
                this.tabIndex++;
                if (this.tabIndex > this.formElements.length - 1) {
                    this.tabIndex = 0;
                }
                if (this.tabIndex === this.prevTabIndex) {
                    break;
                }
            }
        }
        else if (key === 38 || key === 37 || (e.shiftKey && key == 9)) {
            isNavigationKey = true;
            this.prevTabIndex = this.tabIndex;
            this.tabIndex--;
            if (this.tabIndex < 0) {
                this.tabIndex = this.formElements.length - 1;
                this.prevTabIndex = 0;
            }
            while (this.formElements[this.tabIndex].disabled === true) {
                this.tabIndex--;
                if (this.tabIndex === this.prevTabIndex) {
                    break;
                }
                if (this.tabIndex < 0) {
                    this.tabIndex = this.formElements.length - 1;
                }
            }
        }
        if (isNavigationKey === true) {
            e.preventDefault();
            // set focus on the checkbox                    
            this.formElements[this.tabIndex].focus();
            var actEl = document.activeElement;
            if (actEl.type.toUpperCase() === 'CHECKBOX') {
                this.setFocusStyle(this.tabIndex);
                this.removeFocusStyle(this.prevTabIndex);
            }
            else {
                this.removeFocusStyle(this.prevTabIndex);
                this.removeFocusStyle(this.helperItemsLength);
                this.removeFocusStyle(this.formElements.length - 1);
            }
        }
        isNavigationKey = false;
    };
    // set (add) CSS style on selected row
    IstevenController.prototype.setFocusStyle = function (tabIndex) {
        angular.element(this.formElements[tabIndex]).parent().parent().parent().addClass('multiSelectFocus');
    };
    // remove CSS style on selected row
    IstevenController.prototype.removeFocusStyle = function (tabIndex) {
        angular.element(this.formElements[tabIndex]).parent().parent().parent().removeClass('multiSelectFocus');
    };
    /*********************
        *********************
        *
        * 1) Initializations
        *
        *********************
        *********************/
    // attrs to $scope - attrs-$scope - attrs - $scope
    // Copy some properties that will be used on the template. They need to be in the this.
    IstevenController.prototype.propInitialization = function () {
        var _this = this;
        this.groupProperty = this.attrs.groupProperty;
        this.tickProperty = this.attrs.tickProperty;
        this.directiveId = this.attrs.directiveId;
        // Unfortunately I need to add these grouping properties into the input model
        var tempStr = this.genRandomString(5);
        this.indexProperty = 'idx_' + tempStr;
        this.spacingProperty = 'spc_' + tempStr;
        // set orientation css            
        if (typeof this.attrs.orientation !== 'undefined') {
            if (this.attrs.orientation.toUpperCase() === 'HORIZONTAL') {
                this.orientationH = true;
                this.orientationV = false;
            }
            else {
                this.orientationH = false;
                this.orientationV = true;
            }
        }
        // get elements required for DOM operation
        this.checkBoxLayer = this.element.children().children().next()[0];
        // set max-height property if provided
        if (typeof this.attrs.maxHeight !== 'undefined') {
            var layer = this.element.children().children().children()[0];
            angular.element(layer).attr("style", "height:" + this.attrs.maxHeight + "; overflow-y:scroll;");
        }
        // some flags for easier checking            
        for (var property in this.helperStatus) {
            if (this.helperStatus.hasOwnProperty(property)) {
                if (typeof this.attrs.helperElements !== 'undefined'
                    && this.attrs.helperElements.toUpperCase().indexOf(property.toUpperCase()) === -1) {
                    this.helperStatus[property] = false;
                }
            }
        }
        if (typeof this.attrs.selectionMode !== 'undefined' && this.attrs.selectionMode.toUpperCase() === 'SINGLE') {
            this.helperStatus['all'] = false;
            this.helperStatus['none'] = false;
        }
        // helper button icons.. I guess you can use html tag here if you want to. 
        this.icon = {};
        this.icon.selectAll = '&#10003;'; // a tick icon
        this.icon.selectNone = '&times;'; // x icon
        this.icon.reset = '&#8630;'; // undo icon            
        // this one is for the selected items
        this.icon.tickMark = '&#10003;'; // a tick icon 
        // configurable button labels                       
        if (typeof this.attrs.translation !== 'undefined') {
            this.lang.selectAll = this.$sce.trustAsHtml(this.icon.selectAll + '&nbsp;&nbsp;' + this.translation.selectAll);
            this.lang.selectNone = this.$sce.trustAsHtml(this.icon.selectNone + '&nbsp;&nbsp;' + this.translation.selectNone);
            this.lang.reset = this.$sce.trustAsHtml(this.icon.reset + '&nbsp;&nbsp;' + this.translation.reset);
            this.lang.search = this.translation.search;
            this.lang.nothingSelected = this.$sce.trustAsHtml(this.translation.nothingSelected);
        }
        else {
            this.lang.selectAll = this.$sce.trustAsHtml(this.icon.selectAll + '&nbsp;&nbsp;Select All');
            this.lang.selectNone = this.$sce.trustAsHtml(this.icon.selectNone + '&nbsp;&nbsp;Select None');
            this.lang.reset = this.$sce.trustAsHtml(this.icon.reset + '&nbsp;&nbsp;Reset');
            this.lang.search = 'Search...';
            this.lang.nothingSelected = 'None Selected';
        }
        this.icon.tickMark = this.$sce.trustAsHtml(this.icon.tickMark);
        // min length of keyword to trigger the filter function
        if (typeof this.attrs.MinSearchLength !== 'undefined' && parseInt(this.attrs.MinSearchLength) > 0) {
            this.vMinSearchLength = Math.floor(parseInt(this.attrs.MinSearchLength));
        }
        /*******************************************************
            *******************************************************
            *
            * 2) Logic starts here, initiated by watch 1 & watch 2
            *
            *******************************************************
            *******************************************************/
        // watch1, for changes in input model property
        // updates multi-select when user select/deselect a single checkbox programatically
        // https://github.com/isteven/angular-multi-select/issues/8            
        this.$scope.$watch('isteven.inputModel', function (newVal) {
            if (newVal) {
                _this.refreshOutputModel();
                _this.refreshButton();
            }
        }, true);
        // watch2 for changes in input model as a whole
        // this on updates the multi-select when a user load a whole new input-model. We also update the this.backUp variable
        this.$scope.$watch('isteven.inputModel', function (newVal) {
            if (newVal) {
                _this.backUp = angular.copy(_this.inputModel);
                _this.updateFilter();
                _this.prepareGrouping();
                _this.prepareIndex();
                _this.refreshOutputModel();
                _this.refreshButton();
            }
        });
        // watch for changes in directive state (disabled or enabled)
        this.$scope.$watch('isteven.isDisabled', function (newVal) {
            _this.isDisabled = newVal;
        });
        // this is for touch enabled devices. We don't want to hide checkboxes on scroll. 
        var onTouchStart = function (e) {
            this.$apply(function () {
                this["this"].scrolled = false;
            });
        };
        angular.element(document).bind('touchstart', onTouchStart.bind(this));
        var onTouchMove = function (e) {
            _this.$scope.$applyAsync(function () {
                _this.scrolled = true;
            });
        };
        angular.element(document).bind('touchmove', onTouchMove.bind(this));
        // unbind document events to prevent memory leaks
        this.$scope.$on('$destroy', function () {
            angular.element(document).unbind('touchstart', onTouchStart.bind(_this));
            angular.element(document).unbind('touchmove', onTouchMove.bind(_this));
        });
    };
    IstevenController.$inject = ["$scope", '$sce', '$timeout', '$templateCache', '$element', '$attrs'];
    return IstevenController;
}(Isteven));
angular.module('isteven-multi-select', ['ng'])
    .directive('istevenMultiSelect', [function () {
        return {
            restrict: 'AE',
            scope: {
                // models
                inputModel: '=',
                outputModel: '=',
                // settings based on attribute
                isDisabled: '=',
                // callbacks
                onClear: '&',
                onClose: '&',
                onSearchChange: '&',
                onItemClick: '&',
                onOpen: '&',
                onReset: '&',
                onSelectAll: '&',
                onSelectNone: '&',
                // i18n
                translation: '='
            },
            bindToController: true,
            /*
             * The rest are attributes. They don't need to be parsed / binded, so we can safely access them by value.
             * - buttonLabel, directiveId, helperElements, itemLabel, maxLabels, orientation, selectionMode, minSearchLength,
             *   tickProperty, disableProperty, groupProperty, searchProperty, maxHeight, outputProperties
             */
            templateUrl: 'isteven-multi-select.htm',
            controller: IstevenController,
            controllerAs: 'isteven'
        };
    }]).run(['$templateCache', function ($templateCache) {
        var template = "<span class=\"multiSelect inlineBlock\">" +
            // main button
            "<button id=\"{{isteven.directiveId}}\" type=\"button\"              \n                'ng-click=\"isteven.toggleCheckboxes( $event ); isteven.refreshSelectedItems(); isteven.refreshButton(); isteven.prepareGrouping; isteven.prepareIndex();\"' +\n                'ng-bind-html=\"isteven.varButtonLabel\"\n                'ng-disabled=\"disable-button\"\n            '>";
        '</button>' +
            // overlay layer
            '<div class="checkboxLayer">' +
            // container of the helper elements
            '<div class="helperContainer" ng-if="isteven.helperStatus.filter || isteven.helperStatus.all || isteven.helperStatus.none || isteven.helperStatus.reset ">' +
            // container of the first 3 buttons, select all, none and reset
            '<div class="line" ng-if="isteven.helperStatus.all || isteven.helperStatus.none || isteven.helperStatus.reset ">' +
            // select all
            '<button type="button" class="helperButton"' +
            'ng-disabled="isteven.isDisabled"' +
            'ng-if="isteven.helperStatus.all"' +
            'ng-click="isteven.select( \'all\', $event );"' +
            'ng-bind-html="isteven.lang.selectAll">' +
            '</button>' +
            // select none
            '<button type="button" class="helperButton"' +
            'ng-disabled="isteven.isDisabled"' +
            'ng-if="isteven.helperStatus.none"' +
            'ng-click="isteven.select( \'none\', $event );"' +
            'ng-bind-html="isteven.lang.selectNone">' +
            '</button>' +
            // reset
            '<button type="button" class="helperButton reset"' +
            'ng-disabled="isteven.isDisabled"' +
            'ng-if="isteven.helperStatus.reset"' +
            'ng-click="isteven.select( \'reset\', $event );"' +
            'ng-bind-html="isteven.lang.reset">' +
            '</button>' +
            '</div>' +
            // the search box
            '<div class="line" style="position:relative" ng-if="isteven.helperStatus.filter">' +
            // textfield                
            '<input placeholder="{{isteven.lang.search}}" type="text"' +
            'ng-click="isteven.select( \'filter\', $event )" ' +
            'ng-model="isteven.inputLabel.labelFilter" ' +
            'ng-change="isteven.searchChanged()" class="inputFilter"' +
            '/>' +
            // clear button
            '<button type="button" class="clearButton" ng-click="isteven.clearClicked( $event )" >×</button> ' +
            '</div> ' +
            '</div> ' +
            // selection items
            '<div class="checkBoxContainer">' +
            '<div ' +
            'ng-repeat="item in isteven.filteredModel | filter:isteven.removeGroupEndMarker" class="multiSelectItem"' +
            'ng-class="{selected: item[ isteven.tickProperty ], horizontal: orientationH, vertical: orientationV, multiSelectGroup:item[ groupProperty ], disabled:isteven.itemIsDisabled( item )}"' +
            'ng-click="isteven.syncItems( item, $event, $index );" ' +
            'ng-mouseleave="isteven.removeFocusStyle( tabIndex );"> ' +
            // this is the spacing for grouped items
            '<div class="acol" ng-if="item[ isteven.spacingProperty ] > 0" ng-repeat="i in isteven.numberToArray( item[ isteven.spacingProperty ] ) track by $index">' +
            '</div>  ' +
            '<div class="acol">' +
            '<label>' +
            // input, so that it can accept focus on keyboard click
            '<input class="checkbox focusable" type="checkbox" ' +
            'ng-disabled="isteven.itemIsDisabled( item )" ' +
            'ng-checked="item[ isteven.tickProperty ]" ' +
            'ng-click="isteven.syncItems( item, $event, $index )" />' +
            // item label using ng-bind-hteml
            '<span ' +
            'ng-class="{disabled:isteven.itemIsDisabled( item )}" ' +
            'ng-bind-html="isteven.writeLabel( item, \'itemLabel\' )">' +
            '</span>' +
            '</label>' +
            '</div>' +
            // the tick/check mark
            '<span class="tickMark" ng-if="item[ groupProperty ] !== true && item[ tickProperty ] === true" ng-bind-html="isteven.icon.tickMark"></span>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</span>';
        $templateCache.put('isteven-multi-select.htm', template);
    }]);
