import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { SimpleChange } from "@angular/core";
import { QueryBuilderComponent } from "./query-builder.component";
import { QueryBuilderConfig, Rule } from "./query-builder.interfaces";

describe("QueryBuilderComponent", () => {
  let component: QueryBuilderComponent;
  let fixture: ComponentFixture<QueryBuilderComponent>;
  const initializeComponentWithConfig = (config: QueryBuilderConfig) => {
    component.config = config;
    component.ngOnChanges({ config: new SimpleChange(null, config, true) });
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule],
      declarations: [QueryBuilderComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QueryBuilderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should be created", () => {
    expect(component).toBeTruthy();
  });

  it("addRule should append a rule using defaults and notify callbacks", () => {
    const config: QueryBuilderConfig = {
      fields: {
        age: {
          name: "Age",
          type: "number",
          operators: ["=", ">="],
          defaultValue: 18
        }
      }
    };
    initializeComponentWithConfig(config);
    component.onChangeCallback = jasmine.createSpy("onChange");
    component.onTouchedCallback = jasmine.createSpy("onTouched");

    component.addRule();

    expect(component.data.rules.length).toBe(1);
    const rule = component.data.rules[0] as Rule;
    expect(rule.field).toBe("age");
    expect(rule.operator).toBe("=");
    expect(rule.value).toBe(18);
    expect(component.onTouchedCallback).toHaveBeenCalled();
    expect(component.onChangeCallback).toHaveBeenCalled();
  });

  it("changeField should reset value and operator when field changes", () => {
    const config: QueryBuilderConfig = {
      fields: {
        age: {
          name: "Age",
          type: "number",
          defaultValue: 18,
          operators: ["=", "!="]
        },
        status: {
          name: "Status",
          type: "string",
          defaultValue: "active"
        }
      }
    };
    initializeComponentWithConfig(config);
    component.addRule();
    const rule = component.data.rules[0] as Rule;
    component.getInputContext(rule);
    component.onChangeCallback = jasmine.createSpy("onChange");
    component.onTouchedCallback = jasmine.createSpy("onTouched");

    rule.field = "status";
    component.changeField("status", rule);

    expect(rule.operator).toBe("=");
    expect(rule.value).toBe("active");
    expect(component.onTouchedCallback).toHaveBeenCalled();
    expect(component.onChangeCallback).toHaveBeenCalled();
  });

  it("coerceValueForOperator should wrap scalar values into arrays for multiselect input types", () => {
    const config: QueryBuilderConfig = {
      fields: {
        status: {
          name: "Status",
          type: "category",
          options: [
            { name: "Active", value: "active" },
            { name: "Inactive", value: "inactive" }
          ]
        }
      }
    };
    initializeComponentWithConfig(config);
    const rule: Rule = { field: "status", operator: "in", value: "active" };

    const coerced = component.coerceValueForOperator("in", rule.value, rule);

    expect(coerced).toEqual(["active"]);
  });

  it("validate should return rule-level errors from field validators", () => {
    const config: QueryBuilderConfig = {
      fields: {
        age: {
          name: "Age",
          type: "number",
          validator: () => "Too young"
        }
      }
    };
    initializeComponentWithConfig(config);
    component.data = {
      condition: "and",
      rules: [{ field: "age", value: 5 }]
    };

    const validationResult = component.validate({} as any);

    expect(validationResult).toEqual({
      rules: ["Too young"]
    });
  });
});
