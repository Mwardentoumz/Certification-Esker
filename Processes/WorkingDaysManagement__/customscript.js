"use strict";
var CustomScript;
(function (CustomScript) {
    /** **************** **/
    /** Global variables **/
    /** **************** **/
    const gRecurrenceTypes = {
        "Daily": {
            type: "RadioButton",
            id: Lib.WorkingDays.Management.RecurrenceType.Daily,
            text: "_Daily",
            width: 100
        },
        "Weekly": {
            type: "RadioButton",
            id: Lib.WorkingDays.Management.RecurrenceType.Weekly,
            text: "_Weekly",
            width: 100
        },
        "Monthly": {
            type: "RadioButton",
            id: Lib.WorkingDays.Management.RecurrenceType.Monthly,
            text: "_Monthly",
            width: 100
        },
        "Yearly": {
            type: "RadioButton",
            id: Lib.WorkingDays.Management.RecurrenceType.Yearly,
            text: "_Yearly",
            width: 100
        }
    };
    const gRecurrences = {
        "Yearly": [
            [
                gRecurrenceTypes.Daily,
                {
                    type: "Integer",
                    id: "recurYears",
                    label: "_RecurEveryYears",
                    width: 40
                },
                {
                    type: "Description",
                    id: "years",
                    label: "_year(s)"
                }
            ],
            [
                gRecurrenceTypes.Weekly,
                {
                    type: "RadioButton",
                    id: "onDate",
                    text: "_OnDate",
                    width: 60
                },
                {
                    type: "Integer",
                    id: "day",
                    width: 40
                },
                {
                    type: "ComboBox",
                    id: "onDateMonth",
                    label: "",
                    text: "0=_January\n1=_February\n2=_March\n3=_April\n4=_May\n5=_June\n6=_July\n7=_August\n8=_September\n9=_October\n10=_November\n11=_December",
                    width: 140
                }
            ],
            [
                gRecurrenceTypes.Monthly,
                {
                    type: "RadioButton",
                    id: "onThe",
                    text: "_OnThe",
                    width: 60
                },
                {
                    type: "ComboBox",
                    id: "rank",
                    text: "1=_First\n2=_Second\n3=_Third\n4=_Fourth\n0=_Last",
                    width: 140
                },
                {
                    type: "ComboBox",
                    id: "week",
                    text: "1=_Monday\n2=_Tuesday\n3=_Wednesday\n4=_Thursday\n5=_Friday\n6=_Saturday\n0=_Sunday",
                    width: 140
                },
                {
                    type: "ComboBox",
                    id: "onTheMonth",
                    label: "_of",
                    text: "0=_January\n1=_February\n2=_March\n3=_April\n4=_May\n5=_June\n6=_July\n7=_August\n8=_September\n9=_October\n10=_November\n11=_December",
                    width: 140
                }
            ],
            [
                gRecurrenceTypes.Yearly
            ]
        ],
        "Monthly": [
            [
                gRecurrenceTypes.Daily,
                {
                    type: "RadioButton",
                    id: "onDate",
                    text: "_Day",
                    width: 60
                },
                {
                    type: "Integer",
                    id: "day",
                    width: 40
                },
                {
                    type: "Integer",
                    id: "onDateRecurMonths",
                    label: "_ofEvery",
                    width: 40
                },
                {
                    type: "Description",
                    id: "onDateMonths",
                    label: "_month(s)"
                }
            ],
            [
                gRecurrenceTypes.Weekly,
                {
                    type: "RadioButton",
                    id: "onThe",
                    text: "_OnThe",
                    width: 60
                },
                {
                    type: "ComboBox",
                    id: "rank",
                    text: "1=_First\n2=_Second\n3=_Third\n4=_Fourth\n0=_Last",
                    width: 140
                },
                {
                    type: "ComboBox",
                    id: "week",
                    text: "1=_Monday\n2=_Tuesday\n3=_Wednesday\n4=_Thursday\n5=_Friday\n6=_Saturday\n0=_Sunday",
                    width: 140
                },
                {
                    type: "Integer",
                    id: "onTheRecurMonths",
                    label: "_ofEvery",
                    width: 40
                },
                {
                    type: "Description",
                    id: "onTheMonths",
                    label: "_month(s)"
                }
            ],
            [
                gRecurrenceTypes.Monthly
            ],
            [
                gRecurrenceTypes.Yearly
            ]
        ],
        "Weekly": [
            [
                gRecurrenceTypes.Daily,
                {
                    type: "Integer",
                    id: "recurWeeks",
                    label: "_RecurEveryWeeks",
                    width: 40
                },
                {
                    type: "Description",
                    id: "weeks",
                    label: "_week(s)On"
                }
            ],
            [
                gRecurrenceTypes.Weekly,
                {
                    type: "CheckBox",
                    id: "weekday1",
                    text: "_Monday",
                    width: 100
                },
                {
                    type: "CheckBox",
                    id: "weekday2",
                    text: "_Tuesday",
                    width: 100
                },
                {
                    type: "CheckBox",
                    id: "weekday3",
                    text: "_Wednesday",
                    width: 100
                },
                {
                    type: "CheckBox",
                    id: "weekday4",
                    text: "_Thursday",
                    width: 100
                }
            ],
            [
                gRecurrenceTypes.Monthly,
                {
                    type: "CheckBox",
                    id: "weekday5",
                    text: "_Friday",
                    width: 100
                },
                {
                    type: "CheckBox",
                    id: "weekday6",
                    text: "_Saturday",
                    width: 100
                },
                {
                    type: "CheckBox",
                    id: "weekday0",
                    text: "_Sunday",
                    width: 100
                }
            ],
            [
                gRecurrenceTypes.Yearly
            ]
        ],
        "Daily": [
            [
                gRecurrenceTypes.Daily,
                {
                    type: "Integer",
                    id: "recurDays",
                    label: "_Every",
                    width: 40
                },
                {
                    type: "Description",
                    id: "days",
                    label: "_day(s)"
                }
            ],
            [
                gRecurrenceTypes.Weekly
            ],
            [
                gRecurrenceTypes.Monthly
            ],
            [
                gRecurrenceTypes.Yearly
            ]
        ]
    };
    const gRecurrenceRange = [
        [
            {
                type: "Date",
                id: "startDate",
                label: "_DayOffStart",
                width: 100
            },
            {
                type: "RadioButton",
                id: "noEndDate",
                text: "_NoEndDate",
                width: 60
            }
        ],
        [
            {},
            {
                type: "RadioButton",
                id: "endAfter",
                text: "_EndAfter",
                width: 60
            },
            {
                type: "Integer",
                id: "endAfterOccurrence",
                width: 40
            },
            {
                type: "Description",
                id: "occurrences",
                label: "_occurrence(s)"
            }
        ],
        [
            {},
            {
                type: "RadioButton",
                id: "endBy",
                text: "_EndBy",
                width: 60
            },
            {
                type: "Date",
                id: "endDate",
                width: 100
            }
        ]
    ];
    function checkNumber(control, min, max) {
        const value = control.GetValue();
        if ((Sys.Helpers.IsDefined(min) && value < min) || (Sys.Helpers.IsDefined(max) && value >= max)) {
            control.SetError("This value is not allowed");
            return false;
        }
        return true;
    }
    const gRecurrencesFunc = {
        "Yearly": {
            selectDateType: function (dialog, type) {
                switch (type) {
                    case "day":
                    case "onDateMonth":
                        dialog.GetControl("onDate").Select(0);
                    case "onDate":
                    case Lib.WorkingDays.Management.DateType.OnDate:
                        dialog.GetControl("onThe").Unselect();
                        break;
                    case "rank":
                    case "week":
                    case "onTheMonth":
                        dialog.GetControl("onThe").Select(0);
                    case "onThe":
                    case Lib.WorkingDays.Management.DateType.OnThe:
                        dialog.GetControl("onDate").Unselect();
                        break;
                }
            },
            fillDialog: function (dialog, dayOff) {
                let date = gRow.DayOffStart__.GetValue();
                dialog.GetControl("recurYears").SetValue(dayOff.recurEvery);
                this.selectDateType(dialog, dayOff.dateType);
                if (dayOff.dateType == Lib.WorkingDays.Management.DateType.OnDate) {
                    let day = dayOff.day || !date ? dayOff.day : date.getDate();
                    if (day) {
                        dialog.GetControl("day").SetValue(day);
                    }
                }
                let month = dayOff.month || !date ? dayOff.month : date.getMonth();
                if (month) {
                    dialog.GetControl("onDateMonth").SetValue(month);
                    dialog.GetControl("onTheMonth").SetValue(month);
                }
                dialog.GetControl("rank").SetValue(dayOff.rank);
                dialog.GetControl("week").SetValue(dayOff.week);
            },
            commitDialog: function (dialog, dayOff) {
                const onDate = dialog.GetControl("onDate").IsSelected(0);
                dayOff.recurEvery = dialog.GetControl("recurYears").GetValue();
                dayOff.dateType = onDate ? Lib.WorkingDays.Management.DateType.OnDate : Lib.WorkingDays.Management.DateType.OnThe;
                dayOff.day = dialog.GetControl("day").GetValue();
                dayOff.rank = dialog.GetControl("rank").GetValue();
                dayOff.week = dialog.GetControl("week").GetValue();
                dayOff.month = dialog.GetControl(onDate ? "onDateMonth" : "onTheMonth").GetValue();
            },
            onChange: function (dialog, tabId, event, control) {
                switch (control.GetName()) {
                    case "recurYears":
                        checkNumber(control, 1);
                        return;
                    case "day":
                    case "onDateMonth":
                        // const day = dialog.GetControl("day").GetValue();
                        // const month = dialog.GetControl("onDateMonth").GetValue();
                        // TODO: check day validity
                        break;
                }
                this.selectDateType(dialog, control.GetName());
            }
        },
        "Monthly": {
            selectDateType: function (dialog, type) {
                switch (type) {
                    case "day":
                    case "onDateRecurMonths":
                        dialog.GetControl("onDate").Select(0);
                    case "onDate":
                    case Lib.WorkingDays.Management.DateType.OnDate:
                        dialog.GetControl("onThe").Unselect();
                        break;
                    case "rank":
                    case "week":
                    case "onTheRecurMonths":
                        dialog.GetControl("onThe").Select(0);
                    case "onThe":
                    case Lib.WorkingDays.Management.DateType.OnThe:
                        dialog.GetControl("onDate").Unselect();
                        break;
                }
            },
            fillDialog: function (dialog, dayOff) {
                this.selectDateType(dialog, dayOff.dateType);
                if (dayOff.dateType == Lib.WorkingDays.Management.DateType.OnDate) {
                    let date = gRow.DayOffStart__.GetValue();
                    let day = dayOff.day || !date ? dayOff.day : date.getDate();
                    if (day) {
                        dialog.GetControl("day").SetValue(day);
                    }
                }
                dialog.GetControl("onDateRecurMonths").SetValue(dayOff.recurEvery);
                dialog.GetControl("onTheRecurMonths").SetValue(dayOff.recurEvery);
                dialog.GetControl("rank").SetValue(dayOff.rank);
                dialog.GetControl("week").SetValue(dayOff.week);
            },
            commitDialog: function (dialog, dayOff) {
                const onDate = dialog.GetControl("onDate").IsSelected(0);
                dayOff.recurEvery = dialog.GetControl(onDate ? "onDateRecurMonths" : "onTheRecurMonths").GetValue();
                dayOff.dateType = onDate ? Lib.WorkingDays.Management.DateType.OnDate : Lib.WorkingDays.Management.DateType.OnThe;
                dayOff.day = dialog.GetControl("day").GetValue();
                dayOff.rank = dialog.GetControl("rank").GetValue();
                dayOff.week = dialog.GetControl("week").GetValue();
            },
            onChange: function (dialog, tabId, event, control) {
                switch (control.GetName()) {
                    case "onDateRecurMonths":
                    case "onTheRecurMonths":
                        checkNumber(control, 1);
                        break;
                    case "day":
                        // const day = control.GetValue();
                        // TODO: check day validity
                        break;
                }
                this.selectDateType(dialog, control.GetName());
            }
        },
        "Weekly": {
            fillDialog: function (dialog, dayOff) {
                dialog.GetControl("recurWeeks").SetValue(dayOff.recurEvery);
                if (dayOff.weeks) {
                    dayOff.weeks.forEach((i) => {
                        dialog.GetControl("weekday" + i).Check(true);
                    });
                }
            },
            commitDialog: function (dialog, dayOff) {
                dayOff.weeks = [];
                for (let i = 0; i < 7; i++) {
                    if (dialog.GetControl("weekday" + i).IsChecked()) {
                        dayOff.weeks.push(i);
                    }
                }
                dayOff.recurEvery = dialog.GetControl("recurWeeks").GetValue();
            },
            onChange: function (dialog, tabId, event, control) {
                switch (control.GetName()) {
                    case "recurWeeks":
                        checkNumber(control, 1);
                        break;
                }
            }
        },
        "Daily": {
            fillDialog: function (dialog, dayOff) {
                dialog.GetControl("recurDays").SetValue(dayOff.recurEvery);
            },
            commitDialog: function (dialog, dayOff) {
                dayOff.recurEvery = dialog.GetControl("recurDays").GetValue();
            },
            onChange: function (dialog, tabId, event, control) {
                switch (control.GetName()) {
                    case "recurDays":
                        checkNumber(control, 1);
                        break;
                }
            }
        }
    };
    const gRecurrenceRangeFunc = {
        checkStartDate: function (dialog) {
            if (dialog.GetControl("endBy").IsSelected(0)) {
                const startDate = dialog.GetControl("startDate").GetValue();
                const endDate = dialog.GetControl("endDate").GetValue();
                if (endDate && (!startDate || startDate > endDate)) {
                    dialog.GetControl("startDate").SetValue(endDate);
                }
            }
        },
        checkEndDate: function (dialog) {
            if (dialog.GetControl("endBy").IsSelected(0)) {
                const startDate = dialog.GetControl("startDate").GetValue();
                const endDate = dialog.GetControl("endDate").GetValue();
                if (startDate && (!endDate || startDate > endDate)) {
                    dialog.GetControl("endDate").SetValue(startDate);
                }
            }
        },
        selectRangeType: function (dialog, type) {
            switch (type) {
                case "noEndDate":
                case Lib.WorkingDays.Management.RangeType.NoEndDate:
                    dialog.GetControl("endAfter").Unselect();
                    dialog.GetControl("endBy").Unselect();
                    break;
                case "endAfterOccurrence":
                    dialog.GetControl("endAfter").Select(0);
                case "endAfter":
                case Lib.WorkingDays.Management.RangeType.EndAfter:
                    dialog.GetControl("noEndDate").Unselect();
                    dialog.GetControl("endBy").Unselect();
                    break;
                case "endDate":
                    dialog.GetControl("endBy").Select(0);
                case "endBy":
                case Lib.WorkingDays.Management.RangeType.EndBy:
                    dialog.GetControl("noEndDate").Unselect();
                    dialog.GetControl("endAfter").Unselect();
                    break;
            }
        },
        fillDialog: function (dialog, dayOff) {
            this.selectRangeType(dialog, dayOff.rangeType);
            dialog.GetControl("endAfterOccurrence").SetValue(dayOff.endAfterOccurrence);
            dialog.GetControl("endDate").SetValue(dayOff.endDate);
        },
        commitDialog: function (dialog, dayOff) {
            this.checkEndDate(dialog);
            if (dialog.GetControl("endAfter").IsSelected(0)) {
                dayOff.rangeType = Lib.WorkingDays.Management.RangeType.EndAfter;
            }
            else if (dialog.GetControl("endBy").IsSelected(0)) {
                dayOff.rangeType = Lib.WorkingDays.Management.RangeType.EndBy;
            }
            else {
                dayOff.rangeType = Lib.WorkingDays.Management.RangeType.NoEndDate;
            }
            dayOff.endAfterOccurrence = dialog.GetControl("endAfterOccurrence").GetValue();
            dayOff.endDate = dialog.GetControl("endDate").GetValue();
        },
        onChange: function (dialog, tabId, event, control) {
            this.selectRangeType(dialog, control.GetName());
            switch (control.GetName()) {
                case "endAfterOccurrence":
                    checkNumber(control, 1);
                    break;
                case "startDate":
                case "endBy":
                    this.checkEndDate(dialog);
                    break;
                case "endDate":
                    this.checkStartDate(dialog);
                    break;
            }
        }
    };
    let gDaysOff;
    let gDialogDayOff;
    let gRow;
    function FillDetailsDialog(dialog) {
        dialog.AddText("name", "_DayOffName").SetValue(gDialogDayOff.name);
        dialog.AddSeparator();
        dialog.AddTitle("recurrence", "_Recurrence");
        dialog.AddControlsInGrid(gRecurrences[gDialogDayOff.type]);
        dialog.AddSeparator();
        Sys.Helpers.Object.ForEach(gRecurrenceTypes, type => {
            dialog.GetControl(type.id).Unselect();
        });
        dialog.GetControl(gDialogDayOff.type).Select(0);
        dialog.AddTitle("recurrenceRange", "_RecurrenceRange");
        dialog.AddControlsInGrid(gRecurrenceRange);
        dialog.GetControl("startDate").SetValue(gDialogDayOff.startDate);
        gRecurrencesFunc[gDialogDayOff.type].fillDialog(dialog, gDialogDayOff);
        gRecurrenceRangeFunc.fillDialog(dialog, gDialogDayOff);
        //		dialog.SetWidth("800px");
    }
    function saveDialog(dialog) {
        gDialogDayOff.name = dialog.GetControl("name").GetValue();
        gDialogDayOff.startDate = dialog.GetControl("startDate").GetValue();
        gRecurrencesFunc[gDialogDayOff.type].commitDialog(dialog, gDialogDayOff);
        gRecurrenceRangeFunc.commitDialog(dialog, gDialogDayOff);
    }
    function CommitDetailsDialog(dialog, tabId, event, control) {
        saveDialog(dialog);
        gRow.DayOffName__.SetValue(gDialogDayOff.name);
        gDialogDayOff.startDate = Lib.WorkingDays.Management.ComputeFirstOccurrenceDate(gDialogDayOff) || gDialogDayOff.startDate;
        gRow.DayOffStart__.SetValue(gDialogDayOff.startDate);
        gRow.DayOffEnd__.SetValue(Lib.WorkingDays.Management.ComputeEndDate(gDialogDayOff));
        gRow.DayOffRecurrence__.SetValue(gDialogDayOff.type);
        gDaysOff[gRow.GetLineNumber(true) - 1] = gDialogDayOff;
    }
    function HandleDetailsDialog(dialog, tabId, event, control) {
        if (event === "OnChange") {
            const ctrlName = control.GetName();
            switch (ctrlName) {
                case Lib.WorkingDays.Management.RecurrenceType.Daily:
                case Lib.WorkingDays.Management.RecurrenceType.Weekly:
                case Lib.WorkingDays.Management.RecurrenceType.Monthly:
                case Lib.WorkingDays.Management.RecurrenceType.Yearly:
                    saveDialog(dialog);
                    dialog.Cancel();
                    gDialogDayOff.type = ctrlName;
                    Popup.Dialog("_DaysOffTitle", null, FillDetailsDialog, CommitDetailsDialog, null, HandleDetailsDialog);
                    break;
                default:
                    gRecurrencesFunc[gDialogDayOff.type].onChange(dialog, tabId, event, control);
                    gRecurrenceRangeFunc.onChange(dialog, tabId, event, control);
                    break;
            }
        }
    }
    function GetNewDayOff(type) {
        return {
            name: "",
            startDate: null,
            type: type,
            recurEvery: 1,
            dateType: Lib.WorkingDays.Management.DateType.OnDate,
            day: 0,
            rank: 1,
            week: 1,
            month: 0,
            weeks: [],
            rangeType: Lib.WorkingDays.Management.RangeType.EndAfter,
            endAfterOccurrence: 1,
            endDate: null
        };
    }
    Controls.DaysOffList__.OnAddItem = function (item, index) {
        gDaysOff.splice(index, 0, GetNewDayOff(Lib.WorkingDays.Management.RecurrenceType.Daily));
    };
    Controls.DaysOffList__.OnDeleteItem = function (item, index) {
        gDaysOff.splice(index, 1);
    };
    Controls.DaysOffList__.DayOffName__.OnChange = function () {
        let row = this.GetRow();
        let dayOff = gDaysOff[row.GetLineNumber(true) - 1];
        dayOff.name = row.DayOffName__.GetValue();
    };
    Controls.DaysOffList__.DayOffStart__.OnChange = function () {
        let row = this.GetRow();
        let dayOff = gDaysOff[row.GetLineNumber(true) - 1];
        dayOff.startDate = row.DayOffStart__.GetValue();
        if (dayOff.startDate && dayOff.rangeType == Lib.WorkingDays.Management.RangeType.EndBy) {
            if (!dayOff.endDate || dayOff.startDate > dayOff.endDate) {
                dayOff.endDate = dayOff.startDate;
            }
        }
        row.DayOffEnd__.SetValue(Lib.WorkingDays.Management.ComputeEndDate(dayOff));
    };
    Controls.DaysOffList__.DayOffDetails__.OnClick = function () {
        gRow = this.GetRow();
        gDialogDayOff = gDaysOff[gRow.GetLineNumber(true) - 1];
        Popup.Dialog("_DaysOffTitle", null, FillDetailsDialog, CommitDetailsDialog, null, HandleDetailsDialog);
    };
    function IsFormValid() {
        let ok = true;
        if (!Controls.ConfigName__.GetValue()) {
            if (!Controls.ConfigName__.GetError()) {
                Controls.ConfigName__.SetError("This field is required!");
            }
            ok = false;
        }
        Sys.Helpers.Data.ForEachTableItem("DaysOffList__", (line) => {
            if (!line.GetValue("DayOffStart__")) {
                if (!line.GetError("DayOffStart__")) {
                    line.SetError("DayOffStart__", "This field is required!");
                }
                ok = false;
            }
        });
        return ok;
    }
    function LoadWorkingDays(msn) {
        ProcessInstance.SetSilentChange(true);
        Lib.WorkingDays.Management.LoadWorkingDaysByMSN(msn)
            .Then(workingDays => {
            Controls.ConfigName__.SetValue(workingDays.name);
            Controls.ConfigDescription__.SetValue(workingDays.description);
            for (let i = 0; i < 7; i++) {
                Controls["Weekday" + i + "__"].SetValue(workingDays.weekDays[i]);
            }
            if (workingDays.daysOff) {
                gDaysOff = workingDays.daysOff;
                Controls.DaysOffList__.SetItemCount(gDaysOff.length);
                for (let i = 0; i < gDaysOff.length; i++) {
                    let item = Controls.DaysOffList__.GetItem(i);
                    let dayOff = gDaysOff[i];
                    item.SetValue("DayOffName__", dayOff.name);
                    item.SetValue("DayOffStart__", dayOff.startDate);
                    item.SetValue("DayOffEnd__", Lib.WorkingDays.Management.ComputeEndDate(dayOff));
                    item.SetValue("DayOffRecurrence__", dayOff.type);
                }
            }
            ProcessInstance.SetSilentChange(false);
        })
            .Catch(e => {
            ProcessInstance.SetSilentChange(false);
            // TODO: Popup
        });
    }
    let gWorkingDaysMsn = null;
    Controls.Save.OnClick = function () {
        if (IsFormValid()) {
            Controls.jsonDaysOff__.SetValue(JSON.stringify(gDaysOff));
            if (gWorkingDaysMsn) {
                Variable.SetValueAsString("WorkingDaysMsn", gWorkingDaysMsn);
            }
            return true;
        }
        Process.ShowFirstError();
        return false;
    };
    gDaysOff =
        [
            GetNewDayOff(Lib.WorkingDays.Management.RecurrenceType.Daily)
        ];
    let ancestorsids = ProcessInstance.selectedRuidFromView;
    if (ancestorsids && ancestorsids.length > 0) {
        // CT#FJOIWM000M4H.815433013620666122
        gWorkingDaysMsn = ancestorsids[0].split(".")[1];
        LoadWorkingDays(gWorkingDaysMsn);
    }
})(CustomScript || (CustomScript = {}));
//# sourceMappingURL=customscript.js.map